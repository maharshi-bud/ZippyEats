const items = [
  {
    name: "Paneer Tikka",
    price: 260,
    category: "Indian",
  },
  {
    name: "Butter Chicken",
    price: 320,
    category: "Indian",
  },
];

export default function MenuPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Menu Management
        </h1>

        <button className="bg-orange-500 px-5 py-3 rounded-xl font-medium">
          Add Item
        </button>
      </div>

      <div className="bg-[#151924] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0f1117]">
            <tr>
              <th className="text-left p-4">Item</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.name}
                className="border-t border-white/10"
              >
                <td className="p-4">{item.name}</td>
                <td className="p-4">{item.category}</td>
                <td className="p-4">₹{item.price}</td>

                <td className="p-4 flex gap-3">
                  <button className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400">
                    Edit
                  </button>

                  <button className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}