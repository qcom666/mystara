import type { Metadata } from "next";
import { ContactsView } from "@/components/legal/contacts-view";

export const metadata: Metadata = {
  title: "Contacts & seller details",
  description: "Контакты и реквизиты продавца сервиса Mystara: ФИО, ИНН, почта, Telegram поддержки, оплата и возврат.",
};

export default function ContactsPage() {
  return <ContactsView />;
}
