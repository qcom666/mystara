-- Покупка, за которую выдан бонус пригласившему (забирается при возврате этой покупки).
ALTER TABLE "User" ADD COLUMN "referralRewardPurchaseId" TEXT;
