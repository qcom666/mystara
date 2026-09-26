import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Consent to the Processing of Personal Data",
  description: "Согласие на обработку персональных данных — Mystara.",
};

export default function ConsentPage() {
  return <LegalDocumentView kind="consent" />;
}
