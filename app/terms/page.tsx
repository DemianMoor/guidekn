import { notFound } from "next/navigation";
import { fetchLegalPage, LegalPageView } from "@/components/legal-page";

export const revalidate = 0;

export async function generateMetadata() {
  const page = await fetchLegalPage("terms");
  if (!page) return { title: "SMS Terms & Conditions" };
  return { title: page.title, description: page.seo_description ?? undefined };
}

export default async function TermsPage() {
  const page = await fetchLegalPage("terms");
  if (!page) notFound();
  return <LegalPageView page={page} />;
}
