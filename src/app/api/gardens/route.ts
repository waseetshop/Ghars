import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Climate } from "@prisma/client";

// TODO: استبدل هذا بـ userId من session المستخدم بعد إضافة Auth
const DEV_USER_ID = "dev-user-001";

async function ensureDevUser() {
  return prisma.user.upsert({
    where:  { id: DEV_USER_ID },
    update: {},
    create: { id: DEV_USER_ID, email: "dev@ghars.app", name: "مطور" },
  });
}

// ─── GET /api/gardens ─────────────────────────────────────────
export async function GET() {
  try {
    const gardens = await prisma.garden.findMany({
      where:   { userId: DEV_USER_ID },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { plants: true } },
      },
    });

    return NextResponse.json({ data: gardens });
  } catch (error) {
    console.error("[GET /api/gardens]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/gardens ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, climate } = body as { name?: string; climate?: Climate };

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم الحديقة مطلوب" }, { status: 400 });
    }

    const VALID_CLIMATES: Climate[] = ["HOT_ARID", "MEDITERRANEAN", "TROPICAL", "TEMPERATE"];
    if (climate && !VALID_CLIMATES.includes(climate)) {
      return NextResponse.json({ error: "نوع المناخ غير صحيح" }, { status: 400 });
    }

    await ensureDevUser();

    const garden = await prisma.garden.create({
      data: {
        name:    name.trim(),
        climate: climate ?? "HOT_ARID",
        userId:  DEV_USER_ID,
      },
    });

    return NextResponse.json({ data: garden }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/gardens]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
