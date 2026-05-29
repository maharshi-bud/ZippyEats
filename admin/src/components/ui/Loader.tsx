export default function Loader() {
  return (
    <div className="w-full flex justify-center items-center">
      <div style={{ width: "200px", height: "60px", position: "relative", zIndex: 1 }}>

        <div style={{ width: "20px", height: "20px", position: "absolute", borderRadius: "50%", backgroundColor: "#fff", left: "15%", transformOrigin: "50%", animation: "circle7124 .5s alternate infinite ease" }} />
        <div style={{ width: "20px", height: "20px", position: "absolute", borderRadius: "50%", backgroundColor: "#fff", left: "45%", transformOrigin: "50%", animation: "circle7124 .5s alternate infinite ease", animationDelay: ".2s" }} />
        <div style={{ width: "20px", height: "20px", position: "absolute", borderRadius: "50%", backgroundColor: "#fff", right: "15%", transformOrigin: "50%", animation: "circle7124 .5s alternate infinite ease", animationDelay: ".3s" }} />

        <div style={{ width: "20px", height: "4px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.9)", position: "absolute", top: "62px", transformOrigin: "50%", zIndex: -1, left: "15%", filter: "blur(1px)", animation: "shadow046 .5s alternate infinite ease" }} />
        <div style={{ width: "20px", height: "4px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.9)", position: "absolute", top: "62px", transformOrigin: "50%", zIndex: -1, left: "45%", filter: "blur(1px)", animation: "shadow046 .5s alternate infinite ease", animationDelay: ".2s" }} />
        <div style={{ width: "20px", height: "4px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.9)", position: "absolute", top: "62px", transformOrigin: "50%", zIndex: -1, right: "15%", filter: "blur(1px)", animation: "shadow046 .5s alternate infinite ease", animationDelay: ".3s" }} />

      </div>

      <style>{`
        @keyframes circle7124 {
          0%   { top: 60px; height: 5px; border-radius: 50px 50px 25px 25px; transform: scaleX(1.7); }
          40%  { height: 20px; border-radius: 50%; transform: scaleX(1); }
          100% { top: 0%; }
        }
        @keyframes shadow046 {
          0%   { transform: scaleX(1.5); }
          40%  { transform: scaleX(1); opacity: .7; }
          100% { transform: scaleX(.2); opacity: .4; }
        }
      `}</style>
    </div>
  );
}