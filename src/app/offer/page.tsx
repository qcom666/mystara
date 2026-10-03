import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Public Offer",
  description: "Публичная оферта на оказание платных услуг сервиса Mystara: цены, оплата, порядок оказания и возврата.",
};

export default function OfferPage() {
  return <LegalDocumentView kind="offer" />;
}
