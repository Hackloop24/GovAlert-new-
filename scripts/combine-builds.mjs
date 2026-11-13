// Combines the two frontend builds into one folder for Vercel:
//   GovAlert/dist          -> dist/            (served at /)
//   Community_portal/dist  -> dist/community/  (served at /community)
import { cpSync, existsSync, rmSync } from "node:fs";

const out = "dist";
for (const dir of ["GovAlert/dist", "Community_portal/dist"]) {
  if (!existsSync(dir)) {
    console.error(`Missing ${dir} - did the frontend build fail?`);
    process.exit(1);
  }
}

rmSync(out, { recursive: true, force: true });
cpSync("GovAlert/dist", out, { recursive: true });
cpSync("Community_portal/dist", `${out}/community`, { recursive: true });
console.log("Combined frontends into dist/ (GovAlert at /, Community portal at /community)");
