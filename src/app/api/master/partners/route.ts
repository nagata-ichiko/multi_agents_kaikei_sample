import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { partnerCreateSchema } from "@/lib/master/schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const active = searchParams.get("active");
    const q = searchParams.get("q");

    const partners = await prisma.partner.findMany({
      where: {
        ...(type ? { type: type as "CUSTOMER" | "VENDOR" | "BOTH" } : {}),
        ...(active !== null
          ? { isActive: active === "true" }
          : {}),
        ...(q
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { kana: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        kana: true,
        type: true,
        email: true,
        phone: true,
        address: true,
        note: true,
        isActive: true,
      },
    });

    return jsonOk(partners);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = partnerCreateSchema.parse(body);

    // 取引先コード重複チェック
    const existing = await prisma.partner.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return jsonError(409, "取引先コードが既に使用されています");
    }

    const partner = await prisma.partner.create({
      data: {
        code: data.code,
        name: data.name,
        kana: data.kana ?? null,
        type: data.type,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        kana: true,
        type: true,
        email: true,
        phone: true,
        address: true,
        note: true,
        isActive: true,
      },
    });

    return jsonOk(partner, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
