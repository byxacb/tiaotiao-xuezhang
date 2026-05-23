import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const secretPatterns = [
  /Bearer\s+[A-Za-z0-9._~+/=-]{24,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /gw-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  /(API_KEY|SECRET|TOKEN)\s*[:=]\s*["']?(?!your_|process\.env|import\.meta|undefined|null)[A-Za-z0-9._~+/=-]{24,}/i
];

const ignored = new Set([".env.example", "package-lock.json", "package.json"]);

const files = execFileSync("git", ["ls-files", "-z", "--others", "--cached", "--exclude-standard"])
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter((file) => !ignored.has(file) && !file.startsWith("node_modules/") && !file.startsWith("dist/"));

const offenders = [];
for (const file of files) {
  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      offenders.push(`${file}: matches ${pattern}`);
    }
  }
}

if (offenders.length) {
  console.error("Potential secret-like strings found:");
  console.error(offenders.join("\n"));
  process.exit(1);
}

console.log("No obvious secret-like strings found in tracked/untracked source files.");
