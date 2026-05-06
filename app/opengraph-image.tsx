import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Guide Kin — Guidance from people who get it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FAF8F3",
          padding: "80px 96px",
          justifyContent: "space-between",
        }}
      >
        {/* Top: Wordmark */}
        <div
          style={{
            color: "#0F6E56",
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          Guide Kin
        </div>

        {/* Middle: Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 84,
              fontWeight: 500,
              color: "#2C2C2A",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Guidance from people who get it.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#2C2C2A",
              opacity: 0.7,
              maxWidth: 900,
            }}
          >
            A free community for adults 35+ figuring out what&apos;s next.
          </div>
        </div>

        {/* Bottom: Tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#2C2C2A",
            opacity: 0.6,
            fontSize: 22,
          }}
        >
          <div>guidekn.com</div>
          <div>Live well, longer.</div>
        </div>
      </div>
    ),
    size
  );
}