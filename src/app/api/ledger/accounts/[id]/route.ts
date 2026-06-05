import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { AccountUpdateSchema } from "@/lib/ledger/schemas";

type Params = { params: Promise<{ id: string }> };

// GET /api/ledger/accounts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const account = await prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        description: true,
        isActive: true,
      },
    });
    if (!account) return jsonError(404, "勘定科目が見つかりません");
    return jsonOk(account);
  } catch (e) {
    return handleApiError(e);
  }
}

// PATCH /api/ledger/accounts/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = AccountUpdateSchema.parse(body);

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "勘定科目が見つかりません");

    // 科目コード重複チェック（変更する場合のみ）
    if (parsed.code && parsed.code !== existing.code) {
      const dup = await prisma.account.findUnique({
        where: { code: parsed.code },
      });
      if (dup) return jsonError(409, "科目コードが既に使用されています");
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(parsed.code !== undefined && { code: parsed.code }),
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.type !== undefined && { type: parsed.type }),
        ...(parsed.description !== undefined && {
          description: parsed.description,
        }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
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

    return jsonOk(account);
  } catch (e) {
    return handleApiError(e);
  }
}

// DELETE /api/ledger/accounts/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "勘定科目が見つかりません");

    // 仕訳明細で使用中か確認
    const lineCount = await prisma.journalLine.count({
      where: { accountId: id },
    });
    if (lineCount > 0) {
      return jsonError(
        409,
        "この勘定科目は仕訳明細で使用されているため削除できません。代わりに無効化（isActive=false）を検討してください"
      );
    }

    await prisma.account.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
