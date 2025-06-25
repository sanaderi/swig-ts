import fs from "node:fs"
import path from "node:path"

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

// Step 1: Get versions of all internal packages
const packageVersions = {};
fs.readdirSync(PACKAGES_DIR).forEach((dir) => {
  const pkgPath = path.join(PACKAGES_DIR, dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    packageVersions[pkg.name] = pkg.version;
  }
});

// Step 2: Replace workspace:* with actual versions
fs.readdirSync(PACKAGES_DIR).forEach((dir) => {
  const pkgPath = path.join(PACKAGES_DIR, dir, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  let updated = false;

  ["dependencies", "devDependencies", "peerDependencies"].forEach((field) => {
    const deps = pkg[field];
    if (!deps) return;

    Object.entries(deps).forEach(([dep, version]) => {
      if (version === "workspace:*" && packageVersions[dep]) {
        deps[dep] = packageVersions[dep];
        updated = true;
      }
    });
  });

  if (updated) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Updated ${pkg.name}`);
  }
});