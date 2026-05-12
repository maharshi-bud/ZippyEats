const orders = [
  {
    id: 1001,
    customer: "Rahul",
    amount: 540,
    status: "accepted",
  },
  {
    id: 1002,
    customer: "Amit",
    amount: 320,
    status: "preparing",
  },
];

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-[#151924] border border-white/10 rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <h2 className="font-semibold">
                Order #{order.id}
              </h2>

              <p className="text-gray-400 text-sm">
                {order.customer}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-orange-400 font-semibold">
                ₹{order.amount}
              </span>

              <select className="bg-[#0f1117] border border-white/10 px-4 py-2 rounded-xl">
                <option>accepted</option>
                <option>preparing</option>
                <option>out_for_delivery</option>
                <option>delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}