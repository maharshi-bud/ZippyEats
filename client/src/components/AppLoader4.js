"use client";

export default function AppLoader({ fullScreen = false, label = "Loading" }) {
  return (
    <div
      className={fullScreen ? "app-loader-screen" : "app-loader-inline"}
      role="status"
      aria-live="polite"
    >
      <div className="loader-spinner">
        <div className="loader-ring"></div>
        <div className="loader-ring loader-ring--2"></div>
        <svg
          className="loader-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="#22c55e"
          />
        </svg>
      </div>

      <span className="app-loader-text">{label}</span>

      <style jsx>{`
        .app-loader-screen,
        .app-loader-inline {
          display: grid;
          place-items: center;
          gap: 0.75rem;
        }

        .app-loader-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          min-height: 100vh;
          background: rgba(255, 255, 255, 0.92);
        }

        .app-loader-inline {
          min-height: 50vh;
        }

        .app-loader-text {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.02em;
        }

        .loader-spinner {
          position: relative;
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
        }

        .loader-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #22c55e;
          animation: spin 0.8s linear infinite;
          will-change: transform;
        }

        .loader-ring--2 {
          inset: 6px;
          border-top-color: transparent;
          border-right-color: #86efac;
          animation-duration: 1.2s;
          animation-direction: reverse;
        }

        .loader-icon {
          width: 22px;
          height: 22px;
          animation: pulse 1.5s ease-in-out infinite;
          will-change: opacity;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        @media (prefers-color-scheme: dark) {
          .app-loader-screen {
            background: rgba(15, 23, 42, 0.92);
          }
          .app-loader-text {
            color: #94a3b8;
          }
        }
      `}</style>
    </div>
  );
}