import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { artifactNames } from "./release-version.mjs";

const root = process.cwd();
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const [
  windowsSetup,
  windowsPortable,
  linuxPortable,
  linuxDeb,
  linuxRpm,
  macosArm64,
  macosX64,
] = artifactNames(version);
const detectedPlatform =
  process.platform === "win32"
    ? "windows"
    : process.platform === "darwin"
      ? `macos-${process.arch}`
      : "linux";
const platform = process.argv[2] || detectedPlatform;
const out = path.join(root, "dist/release-assets");
const supportedPlatforms = [
  "windows",
  "linux",
  "macos-arm64",
  "macos-x64",
  "all",
];
if (!supportedPlatforms.includes(platform)) {
  throw new Error(`unknown release asset platform: ${platform}`);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function walk(dir) {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(entryPath) : [entryPath];
      })
    : [];
}

const forgeOut = path.join(root, "out");
const files = walk(forgeOut);
const specsByPlatform = {
  windows: [
    { match: /Setup\.exe$/i, name: windowsSetup },
    { match: /win32-x64.*\.zip$/i, name: windowsPortable },
  ],
  linux: [
    { match: /\.deb$/i, name: linuxDeb },
    { match: /\.rpm$/i, name: linuxRpm },
    { match: /linux-x64.*\.zip$/i, name: linuxPortable },
  ],
  "macos-arm64": [{ match: /darwin-arm64.*\.zip$/i, name: macosArm64 }],
  "macos-x64": [{ match: /darwin-x64.*\.zip$/i, name: macosX64 }],
};
const selectedPlatforms =
  platform === "all"
    ? ["windows", "linux", "macos-arm64", "macos-x64"]
    : [platform];
const artifacts = [];
for (const current of selectedPlatforms) {
  for (const spec of specsByPlatform[current]) {
    const found = files.find((file) => spec.match.test(file));
    if (!found)
      throw new Error(
        `missing real Forge output for ${spec.name}; searched ${forgeOut}`,
      );
    const destination = path.join(out, spec.name);
    fs.copyFileSync(found, destination);
    const buffer = fs.readFileSync(destination);
    artifacts.push({
      sourcePath: path.relative(root, found),
      name: spec.name,
      path: path.relative(root, destination),
      size: buffer.length,
      sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    });
  }
}
fs.writeFileSync(
  path.join(out, `${platform}-manifest.json`),
  JSON.stringify({ platform, version, artifacts }, null, 2),
);
fs.writeFileSync(
  path.join(out, `${platform}-SHA256SUMS.txt`),
  artifacts
    .map((artifact) => `${artifact.sha256}  ${artifact.name}`)
    .join("\n") + "\n",
);
console.log(`normalized ${artifacts.length} ${platform} artifacts`);
