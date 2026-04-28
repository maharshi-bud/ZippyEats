"use client";

export default function MenuItem({ item, onAdd }) {
  return (
    <div className="card">
      <h4>{item.name}</h4>
      <p>{item.description}</p>
      <p>₹{item.price}</p>
      <button className="btn" onClick={() => onAdd(item)}>
        Add
      </button>
    </div>
  );
}