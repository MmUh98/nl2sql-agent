import { seed } from "../src/app/database";

seed().then(() => {
  console.log("✅ Database seeded");
  process.exit(0);
});
