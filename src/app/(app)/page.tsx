export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-12 py-16 max-w-md">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
        <p className="text-gray-500 text-sm">
          フェーズ2（reporting ドメイン）で実装予定
        </p>
        <p className="text-gray-400 text-xs mt-2">
          KPI・月次グラフ・最近の仕訳が表示されます
        </p>
      </div>
    </div>
  );
}
