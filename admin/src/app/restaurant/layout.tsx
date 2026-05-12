export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-black text-white p-6">
        <h2 className="text-2xl font-bold mb-8">
          Restaurant Panel
        </h2>

        <div className="space-y-4">
          <a href="/restaurant">Dashboard</a>
          <a href="/restaurant/orders">Orders</a>
          <a href="/restaurant/menu">Menu</a>
        </div>
      </aside>

      <main className="flex-1 p-8 bg-zinc-100">
        {children}
      </main>
    </div>
  );
}