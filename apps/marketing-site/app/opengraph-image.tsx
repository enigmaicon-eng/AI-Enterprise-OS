import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Enterprise OS — Runtime Infrastructure for Adaptive Enterprises";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#060606",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        {/* Center glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1L11 3.75V8.25L6 11L1 8.25V3.75L6 1Z"
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, letterSpacing: "0.05em" }}>
            AI Enterprise OS
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, zIndex: 1 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
              color: "#f0f0f0",
              marginBottom: 4,
            }}
          >
            The Enterprise
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
              background: "linear-gradient(135deg, #818cf8 0%, #67e8f9 50%, #c4b5fd 100%)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 28,
            }}
          >
            Operating System
          </div>
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.4)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.5,
            }}
          >
            Runtime infrastructure for adaptive enterprises.
            <br />
            Persistent memory. Structured governance.
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
