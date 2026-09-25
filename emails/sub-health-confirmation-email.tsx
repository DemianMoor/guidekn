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
  Text,
} from "@react-email/components";

// Transactional confirmation for /sub-health signups. Styling mirrors
// welcome-email.tsx; no offers, partner links, or promotional content.

interface SubHealthConfirmationEmailProps {
  name?: string | null;
  interests: string[];
  emailConsent: boolean;
  smsConsent: boolean;
}

const INTEREST_LABELS: Record<string, string> = {
  medicare: "Medicare",
  aca: "ACA / Health Insurance Marketplace",
  other_healthcare: "Other Healthcare",
};

const SITE_URL = "https://www.guidekn.com";
const UNSUBSCRIBE_URL = "mailto:hello@guidekn.com?subject=Unsubscribe";

const text = {
  color: "#2C2C2A",
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 16px 0",
};
const bullet = { ...text, fontSize: "15px", margin: "0 0 8px 0" };
const footer = { color: "#666", fontSize: "12px", lineHeight: "1.6", margin: "0 0 8px 0" };
const footerLink = { color: "#666", textDecoration: "underline" };

export const SUB_HEALTH_CONFIRMATION_SUBJECT =
  "You're signed up for health coverage updates from GuideKin";

export default function SubHealthConfirmationEmail({
  name,
  interests = [],
  emailConsent = false,
  smsConsent = false,
}: SubHealthConfirmationEmailProps) {
  const firstName = name?.trim().split(/\s+/)[0] || "there";
  const interestList = interests.map((i) => INTEREST_LABELS[i]).filter(Boolean).join(", ");

  return (
    <Html>
      <Head />
      <Preview>Here&apos;s what to expect next.</Preview>
      <Body
        style={{
          backgroundColor: "#FAF8F3",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Inter, sans-serif",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 24px" }}>
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
              GuideKin
            </Text>
          </Section>

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
            Hi {firstName},
          </Heading>

          <Text style={text}>
            Thanks for signing up with GuideKin. You&apos;re now on our list for
            health coverage updates.
          </Text>

          {interestList && (
            <Text style={text}>
              You told us you&apos;re interested in:{" "}
              <strong style={{ color: "#0F6E56" }}>{interestList}</strong>.
            </Text>
          )}

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
                margin: "0 0 12px 0",
              }}
            >
              What happens next
            </Text>
            <Text style={bullet}>
              • We&apos;ll send you options that match your interests and location.
            </Text>
            {smsConsent && (
              <Text style={bullet}>
                • Messages come by text to the number you provided. Reply STOP
                at any time to opt out, or HELP for help.
              </Text>
            )}
            {emailConsent && (
              <Text style={bullet}>
                • You&apos;ll also get updates by email. You can unsubscribe
                using the link at the bottom of any email.
              </Text>
            )}
          </Section>

          <Text style={text}>
            Signing up is free, and you&apos;re never obligated to choose a plan.
          </Text>

          <Text style={{ ...text, margin: "0 0 32px 0" }}>
            If you didn&apos;t sign up, you can ignore this email.
          </Text>

          <Text style={{ ...text, margin: 0 }}>The GuideKin Team</Text>

          <Hr style={{ borderColor: "#D3D1C7", margin: "40px 0 24px 0" }} />

          <Text style={footer}>GuideKin (operated by Yelow Sp. z o.o.)</Text>
          <Text style={footer}>
            <Link href={UNSUBSCRIBE_URL} style={footerLink}>
              Unsubscribe
            </Link>{" "}
            (or reply &quot;unsubscribe&quot;) ·{" "}
            <Link href={`${SITE_URL}/privacy`} style={footerLink}>
              Privacy Policy
            </Link>
          </Text>
          <Text style={{ ...footer, margin: 0 }}>
            GuideKin is not affiliated with or endorsed by the U.S. government
            or the federal Medicare program.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
