type CardProps = {
  title: string;
  value: string | number;
};



// admin/src/components/ui/Card.tsx

export default function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-zinc-500">{title}</p>
      <h2 className="text-2xl font-bold text-emerald-600 mt-2">
        {value}
      </h2>
    </div>
  );
}