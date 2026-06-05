import { PrismaClient } from "@prisma/client";

// Enum values (defined directly to avoid dependency on generated Prisma client enums)
const AccountType = {
  ASSET: "ASSET" as const,
  LIABILITY: "LIABILITY" as const,
  EQUITY: "EQUITY" as const,
  REVENUE: "REVENUE" as const,
  EXPENSE: "EXPENSE" as const,
};

const PartnerType = {
  CUSTOMER: "CUSTOMER" as const,
  VENDOR: "VENDOR" as const,
  BOTH: "BOTH" as const,
};

const EntryStatus = {
  DRAFT: "DRAFT" as const,
  POSTED: "POSTED" as const,
};

const prisma = new PrismaClient();

async function main() {
  // 勘定科目
  const accounts = [
    { code: "101", name: "現金", type: AccountType.ASSET, description: "手元現金" },
    { code: "102", name: "普通預金", type: AccountType.ASSET, description: "銀行普通預金" },
    { code: "103", name: "売掛金", type: AccountType.ASSET, description: "売上代金の未収分" },
    { code: "104", name: "商品", type: AccountType.ASSET, description: "販売用商品在庫" },
    { code: "105", name: "仮払金", type: AccountType.ASSET, description: "一時的な立替払い" },
    { code: "106", name: "工具器具備品", type: AccountType.ASSET, description: "業務用備品" },
    { code: "107", name: "建物", type: AccountType.ASSET, description: "事務所等の建物" },
    { code: "108", name: "前払費用", type: AccountType.ASSET, description: "前払いした費用" },
    { code: "201", name: "買掛金", type: AccountType.LIABILITY, description: "仕入代金の未払分" },
    { code: "202", name: "未払金", type: AccountType.LIABILITY, description: "費用の未払分" },
    { code: "203", name: "預り金", type: AccountType.LIABILITY, description: "源泉徴収等の預り金" },
    { code: "204", name: "借入金", type: AccountType.LIABILITY, description: "金融機関からの借入" },
    { code: "205", name: "前受金", type: AccountType.LIABILITY, description: "前受けした収益" },
    { code: "301", name: "資本金", type: AccountType.EQUITY, description: "出資された資本" },
    { code: "302", name: "繰越利益剰余金", type: AccountType.EQUITY, description: "過年度の利益累積" },
    { code: "401", name: "売上高", type: AccountType.REVENUE, description: "商品・サービスの売上" },
    { code: "402", name: "受取利息", type: AccountType.REVENUE, description: "預金等の利息収入" },
    { code: "403", name: "雑収入", type: AccountType.REVENUE, description: "その他の収益" },
    { code: "501", name: "仕入高", type: AccountType.EXPENSE, description: "商品の仕入原価" },
    { code: "502", name: "給料手当", type: AccountType.EXPENSE, description: "従業員への給与" },
    { code: "503", name: "法定福利費", type: AccountType.EXPENSE, description: "社会保険料等" },
    { code: "504", name: "地代家賃", type: AccountType.EXPENSE, description: "事務所等の賃借料" },
    { code: "505", name: "水道光熱費", type: AccountType.EXPENSE, description: "電気・ガス・水道代" },
    { code: "506", name: "通信費", type: AccountType.EXPENSE, description: "電話・インターネット代" },
    { code: "507", name: "消耗品費", type: AccountType.EXPENSE, description: "文具等の消耗品" },
    { code: "508", name: "旅費交通費", type: AccountType.EXPENSE, description: "出張・交通費" },
    { code: "509", name: "広告宣伝費", type: AccountType.EXPENSE, description: "広告・宣伝費用" },
    { code: "510", name: "会議費", type: AccountType.EXPENSE, description: "社内会議費用" },
    { code: "511", name: "接待交際費", type: AccountType.EXPENSE, description: "取引先との交際費" },
    { code: "512", name: "支払手数料", type: AccountType.EXPENSE, description: "各種手数料" },
    { code: "513", name: "減価償却費", type: AccountType.EXPENSE, description: "固定資産の償却費" },
    { code: "514", name: "雑費", type: AccountType.EXPENSE, description: "その他の費用" },
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type, description: account.description },
      create: account,
    });
  }
  console.log(`Upserted ${accounts.length} accounts`);

  // 会計期間
  const fy2025 = await prisma.fiscalPeriod.upsert({
    where: { id: "fy2025" },
    update: {},
    create: {
      id: "fy2025",
      name: "2025年度",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isClosed: true,
    },
  });

  const fy2026 = await prisma.fiscalPeriod.upsert({
    where: { id: "fy2026" },
    update: {},
    create: {
      id: "fy2026",
      name: "2026年度",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      isClosed: false,
    },
  });
  console.log("Upserted fiscal periods");

  // 取引先
  const partners = [
    { code: "C001", name: "株式会社サンプル商事", kana: "カブシキガイシャサンプルショウジ", type: PartnerType.CUSTOMER, email: "info@sample-shoji.co.jp", phone: "03-1234-5678" },
    { code: "C002", name: "合同会社テックパートナーズ", kana: "ゴウドウガイシャテックパートナーズ", type: PartnerType.CUSTOMER, email: "contact@tech-partners.co.jp", phone: "03-2345-6789" },
    { code: "V001", name: "株式会社オフィスサプライ", kana: "カブシキガイシャオフィスサプライ", type: PartnerType.VENDOR, email: "order@office-supply.co.jp", phone: "03-3456-7890" },
    { code: "V002", name: "ABCリース株式会社", kana: "エービーシーリースカブシキガイシャ", type: PartnerType.VENDOR, email: "lease@abc-lease.co.jp", phone: "03-4567-8901" },
    { code: "B001", name: "株式会社グローバル商会", kana: "カブシキガイシャグローバルショウカイ", type: PartnerType.BOTH, email: "info@global-shokai.co.jp", phone: "03-5678-9012" },
  ];

  const partnerMap: Record<string, string> = {};
  for (const partner of partners) {
    const p = await prisma.partner.upsert({
      where: { code: partner.code },
      update: { name: partner.name, type: partner.type },
      create: partner,
    });
    partnerMap[partner.code] = p.id;
  }
  console.log(`Upserted ${partners.length} partners`);

  // 勘定科目IDを取得
  const accountMap: Record<string, string> = {};
  const allAccounts = await prisma.account.findMany();
  for (const a of allAccounts) {
    accountMap[a.code] = a.id;
  }

  // 仕訳（既存を全削除してから再作成で冪等）
  // 2025年度 数件
  const fy2025Entries = [
    {
      date: new Date("2025-04-01"),
      description: "期首仕訳 - 現金",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2025.id,
      lines: [
        { accountId: accountMap["101"], debit: 500000, credit: 0, memo: "期首現金", lineOrder: 0 },
        { accountId: accountMap["301"], debit: 0, credit: 500000, memo: "資本金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2025-04-01"),
      description: "期首仕訳 - 普通預金",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2025.id,
      lines: [
        { accountId: accountMap["102"], debit: 2000000, credit: 0, memo: "期首普通預金", lineOrder: 0 },
        { accountId: accountMap["301"], debit: 0, credit: 2000000, memo: "資本金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2025-10-15"),
      description: "売上計上 - 株式会社サンプル商事",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C001"],
      fiscalPeriodId: fy2025.id,
      lines: [
        { accountId: accountMap["103"], debit: 330000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 330000, memo: "売上高", lineOrder: 1 },
      ],
    },
  ];

  // 2026年度 40件程度
  const fy2026Entries = [
    // 4月
    {
      date: new Date("2026-04-01"),
      description: "地代家賃支払 - 4月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["504"], debit: 180000, credit: 0, memo: "事務所家賃4月", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 180000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-05"),
      description: "売上計上 - 株式会社サンプル商事",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["103"], debit: 550000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 550000, memo: "売上高", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-10"),
      description: "仕入 - 株式会社オフィスサプライ",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["V001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["501"], debit: 220000, credit: 0, memo: "商品仕入", lineOrder: 0 },
        { accountId: accountMap["201"], debit: 0, credit: 220000, memo: "買掛金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-15"),
      description: "売掛金回収 - 株式会社サンプル商事",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["102"], debit: 330000, credit: 0, memo: "普通預金入金", lineOrder: 0 },
        { accountId: accountMap["103"], debit: 0, credit: 330000, memo: "売掛金回収（2025/10）", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-20"),
      description: "給料手当支払 - 4月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["502"], debit: 800000, credit: 0, memo: "給料4月", lineOrder: 0 },
        { accountId: accountMap["203"], debit: 0, credit: 80000, memo: "源泉預り金", lineOrder: 1 },
        { accountId: accountMap["102"], debit: 0, credit: 720000, memo: "普通預金", lineOrder: 2 },
      ],
    },
    {
      date: new Date("2026-04-25"),
      description: "法定福利費 - 4月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["503"], debit: 120000, credit: 0, memo: "社会保険料4月", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 120000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-28"),
      description: "買掛金支払 - 株式会社オフィスサプライ",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["V001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["201"], debit: 220000, credit: 0, memo: "買掛金支払", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 220000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    // 5月
    {
      date: new Date("2026-05-01"),
      description: "地代家賃支払 - 5月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["504"], debit: 180000, credit: 0, memo: "事務所家賃5月", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 180000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-08"),
      description: "売上計上 - 合同会社テックパートナーズ",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C002"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["103"], debit: 770000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 770000, memo: "売上高", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-12"),
      description: "消耗品費 - 文具等",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["507"], debit: 35000, credit: 0, memo: "文具・コピー用紙", lineOrder: 0 },
        { accountId: accountMap["101"], debit: 0, credit: 35000, memo: "現金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-15"),
      description: "売掛金回収 - 株式会社サンプル商事（4月分）",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["102"], debit: 550000, credit: 0, memo: "普通預金入金", lineOrder: 0 },
        { accountId: accountMap["103"], debit: 0, credit: 550000, memo: "売掛金回収（4月）", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-20"),
      description: "給料手当支払 - 5月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["502"], debit: 800000, credit: 0, memo: "給料5月", lineOrder: 0 },
        { accountId: accountMap["203"], debit: 0, credit: 80000, memo: "源泉預り金", lineOrder: 1 },
        { accountId: accountMap["102"], debit: 0, credit: 720000, memo: "普通預金", lineOrder: 2 },
      ],
    },
    {
      date: new Date("2026-05-22"),
      description: "水道光熱費 - 5月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["505"], debit: 28000, credit: 0, memo: "電気・ガス代", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 28000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-25"),
      description: "法定福利費 - 5月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["503"], debit: 120000, credit: 0, memo: "社会保険料5月", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 120000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-28"),
      description: "通信費 - 5月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["506"], debit: 45000, credit: 0, memo: "電話・インターネット", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 45000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-30"),
      description: "仕入 - 株式会社グローバル商会",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["B001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["501"], debit: 310000, credit: 0, memo: "商品仕入", lineOrder: 0 },
        { accountId: accountMap["201"], debit: 0, credit: 310000, memo: "買掛金", lineOrder: 1 },
      ],
    },
    // 6月
    {
      date: new Date("2026-06-01"),
      description: "地代家賃支払 - 6月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["504"], debit: 180000, credit: 0, memo: "事務所家賃6月", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 180000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-02"),
      description: "売上計上 - 株式会社サンプル商事",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["103"], debit: 880000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 880000, memo: "売上高", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-03"),
      description: "売掛金回収 - 合同会社テックパートナーズ（5月分）",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C002"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["102"], debit: 770000, credit: 0, memo: "普通預金入金", lineOrder: 0 },
        { accountId: accountMap["103"], debit: 0, credit: 770000, memo: "売掛金回収（5月）", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-04"),
      description: "旅費交通費 - 出張費",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["508"], debit: 65000, credit: 0, memo: "大阪出張", lineOrder: 0 },
        { accountId: accountMap["101"], debit: 0, credit: 65000, memo: "現金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-05"),
      description: "広告宣伝費 - Web広告",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["509"], debit: 120000, credit: 0, memo: "Web広告費", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 120000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-05"),
      description: "接待交際費 - 取引先接待",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["511"], debit: 45000, credit: 0, memo: "株式会社サンプル商事接待", lineOrder: 0 },
        { accountId: accountMap["101"], debit: 0, credit: 45000, memo: "現金", lineOrder: 1 },
      ],
    },
    // 追加仕訳（月次グラフが映えるよう）
    {
      date: new Date("2026-04-03"),
      description: "売上計上 - 株式会社グローバル商会",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["B001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["103"], debit: 440000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 440000, memo: "売上高", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-12"),
      description: "支払手数料 - 銀行振込手数料",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["512"], debit: 5500, credit: 0, memo: "振込手数料", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 5500, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-18"),
      description: "会議費 - 月次定例会議",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["510"], debit: 15000, credit: 0, memo: "月次会議費", lineOrder: 0 },
        { accountId: accountMap["101"], debit: 0, credit: 15000, memo: "現金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-02"),
      description: "売上計上 - 株式会社グローバル商会",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["B001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["103"], debit: 660000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 660000, memo: "売上高", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-10"),
      description: "受取利息 - 普通預金利息",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["102"], debit: 3200, credit: 0, memo: "利息入金", lineOrder: 0 },
        { accountId: accountMap["402"], debit: 0, credit: 3200, memo: "受取利息", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-18"),
      description: "売掛金回収 - 株式会社グローバル商会（4月分）",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["B001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["102"], debit: 440000, credit: 0, memo: "普通預金入金", lineOrder: 0 },
        { accountId: accountMap["103"], debit: 0, credit: 440000, memo: "売掛金回収（4月）", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-31"),
      description: "買掛金支払 - 株式会社グローバル商会",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["B001"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["201"], debit: 310000, credit: 0, memo: "買掛金支払", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 310000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-02"),
      description: "売上計上 - 合同会社テックパートナーズ",
      status: EntryStatus.POSTED,
      partnerId: partnerMap["C002"],
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["103"], debit: 550000, credit: 0, memo: "売掛金", lineOrder: 0 },
        { accountId: accountMap["401"], debit: 0, credit: 550000, memo: "売上高", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-04"),
      description: "水道光熱費 - 6月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["505"], debit: 31000, credit: 0, memo: "電気・ガス代", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 31000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-05"),
      description: "減価償却費 - 備品",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["513"], debit: 25000, credit: 0, memo: "工具器具備品償却", lineOrder: 0 },
        { accountId: accountMap["106"], debit: 0, credit: 25000, memo: "工具器具備品", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-30"),
      description: "水道光熱費 - 4月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["505"], debit: 25000, credit: 0, memo: "電気・ガス代", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 25000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-04-30"),
      description: "通信費 - 4月分",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["506"], debit: 45000, credit: 0, memo: "電話・インターネット", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 45000, memo: "普通預金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-16"),
      description: "旅費交通費 - 名古屋出張",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["508"], debit: 42000, credit: 0, memo: "名古屋出張", lineOrder: 0 },
        { accountId: accountMap["101"], debit: 0, credit: 42000, memo: "現金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-05-24"),
      description: "会議費 - 5月定例会議",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["510"], debit: 18000, credit: 0, memo: "定例会議費", lineOrder: 0 },
        { accountId: accountMap["101"], debit: 0, credit: 18000, memo: "現金", lineOrder: 1 },
      ],
    },
    {
      date: new Date("2026-06-03"),
      description: "支払手数料 - 決済手数料",
      status: EntryStatus.POSTED,
      fiscalPeriodId: fy2026.id,
      lines: [
        { accountId: accountMap["512"], debit: 8800, credit: 0, memo: "決済手数料", lineOrder: 0 },
        { accountId: accountMap["102"], debit: 0, credit: 8800, memo: "普通預金", lineOrder: 1 },
      ],
    },
  ];

  // 既存仕訳を削除して再作成
  const existingEntries = await prisma.journalEntry.findMany({
    where: {
      fiscalPeriodId: { in: [fy2025.id, fy2026.id] },
    },
    select: { id: true },
  });
  if (existingEntries.length > 0) {
    await prisma.journalLine.deleteMany({
      where: { entryId: { in: existingEntries.map((e: { id: string }) => e.id) } },
    });
    await prisma.journalEntry.deleteMany({
      where: { id: { in: existingEntries.map((e: { id: string }) => e.id) } },
    });
  }

  const allEntries = [...fy2025Entries, ...fy2026Entries];
  for (const entry of allEntries) {
    const { lines, ...entryData } = entry;
    const created = await prisma.journalEntry.create({
      data: {
        ...entryData,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            memo: l.memo,
            lineOrder: l.lineOrder,
          })),
        },
      },
    });
    // 貸借確認
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit) {
      throw new Error(`Entry "${created.description}" 貸借不一致: debit=${totalDebit}, credit=${totalCredit}`);
    }
  }

  console.log(`Created ${allEntries.length} journal entries`);
  console.log("Seed completed successfully");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
