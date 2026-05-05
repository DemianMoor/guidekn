import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  pillars: string[];
  emailConsent: boolean;
  smsConsent: boolean;
}

const PILLAR_NAMES: Record<string, string> = {
  body: "Body",
  mind: "Mind",
  glow: "Glow",
  roam: "Roam",
  bonds: "Bonds",
  years: "Years",
};

export default function WelcomeEmail({
  name = "kin",
  pillars = [],
  emailConsent = true,
  smsConsent = false,
}: WelcomeEmailProps) {
  const firstName = name.split(" ")[0] || "kin";
  const pillarLabels = pillars
    .map((p) => PILLAR_NAMES[p])
    .filter(Boolean);

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Guide Kin — quiet, useful writing for adults 35+
      </Preview>
      <Tailwind>
        <Body
          style={{
            backgroundColor: "#FAF8F3",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Inter, sans-serif",
          }}
        >
          <Container
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              padding: "40px 24px",
            }}
          >
            {/* Wordmark */}
            <Section style={{ marginBottom: "40px" }}>
              <Text
                style={{
                  color: "#0F6E56",
                  fontSize: "20px",
                  fontWeight: 500,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Guide Kin
              </Text>
            </Section>

            {/* Headline */}
            <Heading
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: "#2C2C2A",
                fontSize: "36px",
                fontWeight: 500,
                lineHeight: "1.15",
                letterSpacing: "-0.02em",
                margin: "0 0 24px 0",
              }}
            >
              Welcome, {firstName}.
            </Heading>

            {/* Body */}
            <Text
              style={{
                color: "#2C2C2A",
                fontSize: "16px",
                lineHeight: "1.7",
                margin: "0 0 16px 0",
              }}
            >
              You&apos;re on the list. We&apos;re glad you&apos;re here.
            </Text>

            <Text
              style={{
                color: "#2C2C2A",
                fontSize: "16px",
                lineHeight: "1.7",
                margin: "0 0 16px 0",
              }}
            >
              Guide Kin is written for adults 35+ figuring out what&apos;s
              next — honestly, plainspoken, and from people who&apos;ve been
              there. Six topics: Body, Mind, Glow, Roam, Bonds, Years.
              That&apos;s it. No noise, no upsell, no defying anything.
            </Text>

            {pillarLabels.length > 0 && (
              <Text
                style={{
                  color: "#2C2C2A",
                  fontSize: "16px",
                  lineHeight: "1.7",
                  margin: "0 0 16px 0",
                }}
              >
                You told us you&apos;re interested in{" "}
                <strong style={{ color: "#0F6E56" }}>
                  {pillarLabels.join(", ")}
                </strong>
                . We&apos;ll lean into those when we send you things.
              </Text>
            )}

            <Text
              style={{
                color: "#2C2C2A",
                fontSize: "16px",
                lineHeight: "1.7",
                margin: "0 0 24px 0",
              }}
            >
              The first thing you&apos;ll get is a Sunday email — short,
              useful, written like a friend who&apos;s done the research.
              {smsConsent
                ? " You&apos;ll also get the occasional SMS digest, three lines, the headline of the week."
                : ""}
            </Text>

            {/* Sage callout — what to expect */}
            <Section
              style={{
                backgroundColor: "#E1F5EE",
                border: "1px solid #D3D1C7",
                borderRadius: "12px",
                padding: "20px 24px",
                margin: "32px 0",
              }}
            >
              <Text
                style={{
                  color: "#0F6E56",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  margin: "0 0 8px 0",
                }}
              >
                What to expect
              </Text>
              <Text
                style={{
                  color: "#2C2C2A",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                One quiet email a week, usually Sunday morning. Occasional
                content alerts when something is genuinely worth your
                attention. Nothing else, ever.
              </Text>
            </Section>

            <Text
              style={{
                color: "#2C2C2A",
                fontSize: "16px",
                lineHeight: "1.7",
                margin: "0 0 32px 0",
              }}
            >
              In the meantime, the homepage is{" "}
              <Link
                href="https://guidekn.vercel.app"
                style={{ color: "#BA7517", textDecoration: "underline" }}
              >
                here
              </Link>
              . The About page is{" "}
              <Link
                href="https://guidekn.vercel.app/about"
                style={{ color: "#BA7517", textDecoration: "underline" }}
              >
                here
              </Link>
              .
            </Text>

            <Text
              style={{
                color: "#2C2C2A",
                fontSize: "16px",
                lineHeight: "1.7",
                margin: "0 0 8px 0",
              }}
            >
              Live well, longer.
            </Text>

            <Text
              style={{
                color: "#2C2C2A",
                fontSize: "16px",
                lineHeight: "1.7",
                margin: 0,
              }}
            >
              — the Guide Kin team
            </Text>

            <Hr
              style={{
                borderColor: "#D3D1C7",
                margin: "40px 0 24px 0",
              }}
            />

            {/* Footer */}
            <Text
              style={{
                color: "#666",
                fontSize: "12px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              Guide Kin is operated by Yelow Sp. z o.o. We won&apos;t sell
              your data.
            </Text>

            <Text
              style={{
                color: "#666",
                fontSize: "12px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              Don&apos;t want emails from us? Reply to this email with
              &quot;unsubscribe&quot; or click{" "}
              <Link
                href="https://guidekn.vercel.app/unsubscribe"
                style={{ color: "#666", textDecoration: "underline" }}
              >
                here
              </Link>
              . We&apos;ll take you off the list immediately.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}