import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { AccountCreateSchema } from "@/lib/ledger/schemas";

// GET /api/ledger/accounts?type=&active=&q=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") ?? undefined;
    const active = searchParams.get("active");
    const q = searchParams.get("q") ?? undefined;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (active !== null) {
      where.isActive = active === "true";
    }
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        description: true,
        isActive: true,
      },
    });

    return jsonOk(accounts);
  } catch (e) {
    return handleApiError(e);
  }
}

// POST /api/ledger/accounts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AccountCreateSchema.parse(body);

    // 科目コード重複チェック
    const existing = await prisma.account.findUnique({
      where: { code: parsed.code },
    });
    if (existing) {
      return jsonError(409, "科目コードが既に使用されています");
    }

    const account = await prisma.account.create({
      data: {
        code: parsed.code,
        name: parsed.name,
        type: parsed.type,
        description: parsed.description ?? null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        description: true,
        isActive: true,
      },
    });

    return jsonOk(account, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
