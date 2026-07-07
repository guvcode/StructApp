const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "apps", "web-client", "src");
const FORBIDDEN_PATTERNS = [
  /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*fetch\s*\(/,
  /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*fetchQuery\s*\(/,
  /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*load[A-Za-z]+\s*\(/,
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const issues = [];

  FORBIDDEN_PATTERNS.forEach((pattern, idx) => {
    const match = content.match(pattern);
    if (match) {
      const line = content.substring(0, match.index).split("\n").length;
      issues.push({
        file: filePath,
        line,
        pattern: pattern.toString(),
      });
    }
  });

  return issues;
}

function walkDir(dir) {
  const issues = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      issues.push(...walkDir(fullPath));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      issues.push(...checkFile(fullPath));
    }
  }

  return issues;
}

function main() {
  const issues = walkDir(SRC_DIR);

  if (issues.length > 0) {
    console.error("❌ Forbidden useEffect fetch patterns found:\n");
    issues.forEach((issue) => {
      const relPath = path.relative(process.cwd(), issue.file);
      console.error(`  ${relPath}:${issue.line}`);
    });
    process.exit(1);
  }

  console.log("✅ No forbidden useEffect fetch patterns found");
}

main();