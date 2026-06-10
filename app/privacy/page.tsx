import { notFound } from "next/navigation";
import { fetchLegalPage, LegalPageView } from "@/components/legal-page";

export const revalidate = 0;

export async function generateMetadata() {
  const page = await fetchLegalPage("privacy");
  if (!page) return { title: "Privacy Policy" };
  return { title: page.title, description: page.seo_description ?? undefined };
}

export default async function PrivacyPage() {
  const page = await fetchLegalPage("privacy");
  if (!page) notFound();
  return <LegalPageView page={page} />;
}
