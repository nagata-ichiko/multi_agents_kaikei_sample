import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { partnerUpdateSchema } from "@/lib/master/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = await prisma.partner.findUnique({
      where: { id },
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

    if (!partner) {
      return jsonError(404, "取引先が見つかりません");
    }

    return jsonOk(partner);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = partnerUpdateSchema.parse(body);

    // 存在確認
    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "取引先が見つかりません");
    }

    // コード重複チェック（自分以外で同じコードが存在しないか）
    if (data.code && data.code !== existing.code) {
      const codeConflict = await prisma.partner.findUnique({
        where: { code: data.code },
      });
      if (codeConflict) {
        return jsonError(409, "取引先コードが既に使用されています");
      }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.kana !== undefined ? { kana: data.kana ?? null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.email !== undefined ? { email: data.email ?? null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone ?? null } : {}),
        ...(data.address !== undefined ? { address: data.address ?? null } : {}),
        ...(data.note !== undefined ? { note: data.note ?? null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
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

    return jsonOk(partner);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 存在確認
    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "取引先が見つかりません");
    }

    // 使用中チェック（JournalEntryで参照されているか）
    const usageCount = await prisma.journalEntry.count({
      where: { partnerId: id },
    });
    if (usageCount > 0) {
      return jsonError(
        409,
        "この取引先は仕訳で使用中のため削除できません。無効化（isActive=false）を検討してください。"
      );
    }

    await prisma.partner.delete({ where: { id } });

    return jsonOk({ message: "削除しました" });
  } catch (e) {
    return handleApiError(e);
  }
}
