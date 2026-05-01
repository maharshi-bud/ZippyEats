// admin/src/app/(admin)/page.tsx

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-4 gap-6">
        {["Revenue", "Orders", "Users", "Avg Order"].map((item) => (
          <div
            key={item}
            className="bg-white rounded-xl p-5 shadow-sm border"
          >
            <p className="text-gray-500 text-sm">{item}</p>
            <h2 className="text-2xl font-bold mt-2">--</h2>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white h-64 rounded-xl shadow-sm border p-4">
          Chart 1
        </div>

        <div className="bg-white h-64 rounded-xl shadow-sm border p-4">
          Chart 2
        </div>

        <div className="bg-white h-64 rounded-xl shadow-sm border p-4">
          Chart 3
        </div>

        <div className="bg-white h-64 rounded-xl shadow-sm border p-4">
          Chart 4
        </div>
      </div>
    </div>
  );
}