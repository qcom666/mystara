import type { DefaultSession } from "next-auth";
import type { PlanTier } from "@/modules/subscriptions/usage-limit.service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      planTier: PlanTier;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    planTier?: PlanTier;
  }
}
