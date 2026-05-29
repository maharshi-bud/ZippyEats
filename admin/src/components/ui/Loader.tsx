export default function Loader() {
  return (
    <div className="w-full flex justify-center items-center py-10">
      <div style={{ width: "48px", height: "48px", margin: "auto", position: "relative" }}>

        {/* shadow */}
        <div style={{
          width: "48px", height: "5px",
          background: "rgba(15, 23, 42, 0.2)",
          position: "absolute", top: "60px", left: 0,
          borderRadius: "50%",
          animation: "shadow324 0.5s linear infinite",
        }} />

        {/* box */}
        <div style={{
          width: "100%", height: "100%",
          background: "#0f172a",
          position: "absolute", top: 0, left: 0,
          borderRadius: "4px",
          animation: "jump7456 0.5s linear infinite",
        }} />

      </div>

      <style>{`
        @keyframes jump7456 {
          15%  { border-bottom-right-radius: 3px; }
          25%  { transform: translateY(9px) rotate(22.5deg); }
          50%  { transform: translateY(18px) scale(1, .9) rotate(45deg); border-bottom-right-radius: 40px; }
          75%  { transform: translateY(9px) rotate(67.5deg); }
          100% { transform: translateY(0) rotate(90deg); }
        }
        @keyframes shadow324 {
          0%, 100% { transform: scale(1, 1); }
          50%       { transform: scale(1.2, 1); }
        }
      `}</style>
    </div>
  );
}