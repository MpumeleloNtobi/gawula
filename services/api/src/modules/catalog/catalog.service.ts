import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma.module";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listComplexes(near?: { lat: number; lng: number }) {
    const all = await this.prisma.complex.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    });
    if (!near) return all.map(this.toComplexDto);

    const withDistance = all
      .map((c) => ({
        complex: c,
        distanceKm: haversineKm(near, { lat: c.centroidLat, lng: c.centroidLng }),
      }))
      .filter((x) => x.distanceKm <= x.complex.deliveryRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance.map((x) => ({
      ...this.toComplexDto(x.complex),
      distanceKm: Math.round(x.distanceKm * 10) / 10,
    }));
  }

  async getComplex(id: string) {
    const complex = await this.prisma.complex.findUnique({ where: { id } });
    if (!complex) throw new NotFoundException(`Complex ${id} not found`);
    return this.toComplexDto(complex);
  }

  async listOutlets(complexId: string) {
    await this.getComplex(complexId);
    const outlets = await this.prisma.outlet.findMany({
      where: { complexId, status: "active" },
      include: { brand: true },
      orderBy: { name: "asc" },
    });
    return outlets.map((o) => ({
      id: o.id,
      brandId: o.brandId,
      complexId: o.complexId,
      name: o.name,
      tagline: o.tagline,
      coverUrl: o.coverUrl,
      locationInMall: o.locationInMall,
      brand: { id: o.brand.id, name: o.brand.name, slug: o.brand.slug, logoColor: o.brand.logoColor },
    }));
  }

  async getOutletMenu(outletId: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      include: { brand: true, items: { where: { available: true }, orderBy: { name: "asc" } } },
    });
    if (!outlet) throw new NotFoundException(`Outlet ${outletId} not found`);
    return {
      outlet: {
        id: outlet.id,
        name: outlet.name,
        tagline: outlet.tagline,
        coverUrl: outlet.coverUrl,
        brand: { id: outlet.brand.id, name: outlet.brand.name, logoColor: outlet.brand.logoColor },
      },
      items: outlet.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        priceCents: i.priceCents,
        prepTimeMinutes: i.prepTimeMinutes,
        imageUrl: i.imageUrl,
        category: i.category,
        modifiers: i.modifiers,
      })),
    };
  }

  private toComplexDto(c: {
    id: string;
    name: string;
    slug: string;
    centroidLat: number;
    centroidLng: number;
    deliveryRadiusKm: number;
    baseDeliveryFeeCents: number;
  }) {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      centroid: { lat: c.centroidLat, lng: c.centroidLng },
      deliveryRadiusKm: c.deliveryRadiusKm,
      baseDeliveryFeeCents: c.baseDeliveryFeeCents,
    };
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
