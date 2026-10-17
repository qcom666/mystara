import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/purchases", label: "Покупки" },
  { href: "/admin/analytics", label: "Статистика" },
];

/** Навигация админ-панели (серверный компонент: интерактивности не требует). */
export function AdminNav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="font-display text-xl text-gold-300">Mystara · админ-панель</p>
        <nav className="flex gap-4 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-silver-300 transition-colors hover:text-gold-300">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <Link href="/account" className="text-sm text-silver-400 hover:text-gold-300">
        ← В личный кабинет
      </Link>
    </header>
  );
}
