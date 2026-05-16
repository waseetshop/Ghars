import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const catalog = await prisma.plantCatalog.findMany({
      where: category ? { category: category as never } : undefined,
      orderBy: { nameAr: "asc" },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        nameLatin: true,
        category: true,
        lightMin: true,
        lightMax: true,
        lightDescription: true,
        saltSensitivity: true,
        wateringCycleSummer: true,
        wateringCycleWinter: true,
        soilPH_min: true,
        soilPH_max: true,
      },
    });

    return NextResponse.json({ data: catalog, count: catalog.length });
  } catch (error) {
    console.error("[GET /api/catalog]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
