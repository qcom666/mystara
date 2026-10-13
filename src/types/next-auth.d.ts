import type { DefaultSession } from "next-auth";
import type { PlanTier } from "@/modules/subscriptions/usage-limit.service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      planTier: PlanTier;
      /** true для аккаунтов из ADMIN_USER_IDS / ADMIN_TELEGRAM_IDS (lib/admin.ts); сами права проверяются на сервере. */
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    planTier?: PlanTier;
  }
}
