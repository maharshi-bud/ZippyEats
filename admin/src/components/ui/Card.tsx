type CardProps = {
  title: string;
  value: string | number;
};

export default function Card({ title, value }: CardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
        {value}
      </h2>
    </div>
  );
}
