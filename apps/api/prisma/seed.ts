import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** System user for omnibus + fee sinks (configure via env in production). */
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: {
      id: SYSTEM_USER_ID,
      email: "system@internal.local",
    },
    update: {},
  });

  const assets = ["USDT", "BTC", "ETH"];
  for (const asset of assets) {
    for (const kind of ["AVAILABLE", "ESCROW", "POOL"] as const) {
      await prisma.account.upsert({
        where: {
          userId_kind_asset: {
            userId: SYSTEM_USER_ID,
            kind,
            asset,
          },
        },
        create: {
          userId: SYSTEM_USER_ID,
          kind,
          asset,
          balance: 0,
        },
        update: {},
      });
    }
  }

  console.log("Seed: system user + omnibus accounts ready.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
