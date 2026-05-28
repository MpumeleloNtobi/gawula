import { Controller, Get, Param, Query, ParseFloatPipe, Optional } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("complexes")
  list(@Query("lat") lat?: string, @Query("lng") lng?: string) {
    const near =
      lat && lng ? { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) } : undefined;
    return this.catalog.listComplexes(near);
  }

  @Get("complexes/:id")
  get(@Param("id") id: string) {
    return this.catalog.getComplex(id);
  }

  @Get("complexes/:id/outlets")
  outlets(@Param("id") id: string) {
    return this.catalog.listOutlets(id);
  }

  @Get("outlets/:id/menu")
  menu(@Param("id") id: string) {
    return this.catalog.getOutletMenu(id);
  }
}
