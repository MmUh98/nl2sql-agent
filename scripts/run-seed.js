const { seed } = require("../src/app/database.ts");

seed().then(() => {
  console.log("✅ Database seeded");
  process.exit(0);
});
