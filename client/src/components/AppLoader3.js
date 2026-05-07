"use client";

export default function AppLoader({ fullScreen = false, label = "Loading" }) {
  return (
    <div className={fullScreen ? "loader-screen" : "loader-inline"}>
      <div className="spinner" />
      <p className="loader-text">{label}</p>
      <style jsx>{`
        .loader-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          gap: 1rem;
        }
        .loader-inline {
          display: grid;
          place-items: center;
          gap: 1rem;
          min-height: 50vh;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .loader-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}