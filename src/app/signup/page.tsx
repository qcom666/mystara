import { redirect } from "next/navigation";

// Регистрации по e-mail больше нет: аккаунт создаётся при первом входе через Telegram.
// Страница оставлена, чтобы старые ссылки вели на вход, а не в 404.
export default function SignupPage() {
  redirect("/login");
}
