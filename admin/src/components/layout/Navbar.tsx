// admin/src/components/layout/Navbar.tsx

export default function Navbar() {
  return (
    <div className="h-full bg-white border-b flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold tracking-tight">
        ZippyEats Admin
      </h1>

      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">Admin</div>
        <div className="w-9 h-9 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}