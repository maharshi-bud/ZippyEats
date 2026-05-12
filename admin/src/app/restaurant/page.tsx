export default function RestaurantDashboard() {
  return (
    <div className="min-h-screen bg-zinc-100 p-8">
      <h1 className="text-4xl font-bold mb-8">
        Restaurant Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-xl font-semibold">
            Total Orders
          </h2>

          <p className="text-4xl font-bold mt-4">
            0
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-xl font-semibold">
            Revenue
          </h2>

          <p className="text-4xl font-bold mt-4">
            ₹0
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-xl font-semibold">
            Pending Orders
          </h2>

          <p className="text-4xl font-bold mt-4">
            0
          </p>
        </div>
      </div>
    </div>
  );
}