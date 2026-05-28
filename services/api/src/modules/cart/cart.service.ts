import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import Redis from "ioredis";
import { randomUUID } from "node:crypto";
import { REDIS } from "../../infrastructure/redis.module";
import { PrismaService } from "../../infrastructure/prisma.module";
import { AddCartItemDto, CreateCartDto, UpdateCartItemDto } from "./cart.dto";

interface StoredLine {
  id: string;
  outletId: string;
  itemId: string;
  qty: number;
  modifiers: { groupId: string; optionIds: string[] }[];
  notes?: string;
  unitPriceCents: number;
}

interface StoredCart {
  id: string;
  customerId: string;
  complexId: string;
  lines: StoredLine[];
  createdAt: string;
  expiresAt: string;
}

const TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class CartService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCartDto): Promise<StoredCart> {
    const complex = await this.prisma.complex.findUnique({ where: { id: dto.complexId } });
    if (!complex) throw new NotFoundException(`Complex ${dto.complexId} not found`);
    const now = new Date();
    const cart: StoredCart = {
      id: randomUUID(),
      customerId: dto.customerId,
      complexId: dto.complexId,
      lines: [],
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TTL_SECONDS * 1000).toISOString(),
    };
    await this.save(cart);
    return cart;
  }

  async get(cartId: string): Promise<StoredCart> {
    const raw = await this.redis.get(this.key(cartId));
    if (!raw) throw new NotFoundException(`Cart ${cartId} not found`);
    return JSON.parse(raw) as StoredCart;
  }

  async addItem(cartId: string, dto: AddCartItemDto): Promise<StoredCart> {
    const cart = await this.get(cartId);
    const outlet = await this.prisma.outlet.findUnique({ where: { id: dto.outletId } });
    if (!outlet) throw new NotFoundException(`Outlet ${dto.outletId} not found`);
    if (outlet.complexId !== cart.complexId) {
      throw new BadRequestException(
        `Outlet belongs to a different complex than this cart (${outlet.complexId} vs ${cart.complexId})`,
      );
    }
    const item = await this.prisma.item.findUnique({ where: { id: dto.itemId } });
    if (!item || item.outletId !== dto.outletId) {
      throw new NotFoundException(`Item ${dto.itemId} not found on outlet ${dto.outletId}`);
    }
    if (!item.available) throw new BadRequestException(`Item ${dto.itemId} is not available`);

    const modifiers = dto.modifiers ?? [];
    const signature = lineSignature(dto.itemId, modifiers, dto.notes);
    const existing = cart.lines.find((l) => lineSignature(l.itemId, l.modifiers, l.notes) === signature);
    if (existing) {
      existing.qty += dto.qty;
    } else {
      cart.lines.push({
        id: randomUUID(),
        outletId: dto.outletId,
        itemId: dto.itemId,
        qty: dto.qty,
        modifiers,
        notes: dto.notes,
        unitPriceCents: item.priceCents,
      });
    }
    await this.save(cart);
    return cart;
  }

  async updateItem(cartId: string, lineId: string, dto: UpdateCartItemDto): Promise<StoredCart> {
    const cart = await this.get(cartId);
    const line = cart.lines.find((l) => l.id === lineId);
    if (!line) throw new NotFoundException(`Line ${lineId} not in cart`);
    if (dto.qty === 0) {
      cart.lines = cart.lines.filter((l) => l.id !== lineId);
    } else {
      line.qty = dto.qty;
    }
    await this.save(cart);
    return cart;
  }

  async removeItem(cartId: string, lineId: string): Promise<StoredCart> {
    const cart = await this.get(cartId);
    cart.lines = cart.lines.filter((l) => l.id !== lineId);
    await this.save(cart);
    return cart;
  }

  async clear(cartId: string): Promise<void> {
    await this.redis.del(this.key(cartId));
  }

  private async save(cart: StoredCart) {
    await this.redis.set(this.key(cart.id), JSON.stringify(cart), "EX", TTL_SECONDS);
  }

  private key(cartId: string) {
    return `cart:${cartId}`;
  }
}

function lineSignature(
  itemId: string,
  modifiers: { groupId: string; optionIds: string[] }[],
  notes?: string,
): string {
  const modSig = [...modifiers]
    .map((m) => `${m.groupId}:${[...m.optionIds].sort().join(",")}`)
    .sort()
    .join("|");
  return `${itemId}::${modSig}::${notes ?? ""}`;
}
