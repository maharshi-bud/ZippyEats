"use client";

export default function CuisineBar({ selected, setSelected }) {
  const cuisines = [
    { name: "All", emoji: "🍽️" },
    { name: "Indian", emoji: "🍛" },
    { name: "Gujarati", emoji: "🥟" },
    { name: "Italian", emoji: "🍕" },
    { name: "Chinese", emoji: "🥡" },
    { name: "Fast Food", emoji: "🍔" }
  ];

  return (
    <div className="cuisine-bar">
      {cuisines.map((c) => (
        <div
          key={c.name}
          className={`cuisine-item ${
            selected === c.name ? "active" : ""
          }`}
          onClick={() => setSelected(c.name)}
        >
          <span className="emoji">{c.emoji}</span>
          <p>{c.name}</p>
        </div>
      ))}
    </div>
  );
}