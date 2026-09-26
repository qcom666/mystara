import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Mystara collects, uses, stores and protects personal data (Политика конфиденциальности).",
};

export default function PrivacyPage() {
  return <LegalDocumentView kind="privacy" />;
}
