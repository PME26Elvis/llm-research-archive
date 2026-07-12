import fs from "node:fs";
import semver from "semver";

export function rootPackageVersion(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(`${root}/package.json`, "utf8")).version;
}

export function assertValidSemver(version, label = "version") {
  if (!semver.valid(version))
    throw new Error(`${label} is not valid SemVer: ${version}`);
  return version;
}

export function versionFromTag(tag) {
  const value = String(tag ?? "")
    .trim()
    .replace(/^v/, "");
  return semver.valid(value) ? value : null;
}

export function selectReleaseVersion({
  packageVersion,
  requestedVersion = "",
  channel = "prerelease",
  existingTags = [],
}) {
  const packageSemver = assertValidSemver(
    packageVersion,
    "package.json version",
  );
  if (!["stable", "prerelease"].includes(channel)) {
    throw new Error(`channel must be stable or prerelease: ${channel}`);
  }

  const existingVersions = [
    ...new Set(existingTags.map(versionFromTag).filter(Boolean)),
  ].sort(semver.compare);
  const existing = new Set(existingVersions);
  const highestExisting = existingVersions.at(-1) ?? null;
  const requested = String(requestedVersion ?? "").trim();

  if (requested) {
    const version = assertValidSemver(requested, "requested_version");
    if (channel === "stable" && semver.prerelease(version)) {
      throw new Error(
        `stable channel cannot release prerelease version: ${version}`,
      );
    }
    if (existing.has(version)) {
      throw new Error(
        `requested_version ${version} already exists as a tag, draft, or published release; choose another version or leave it blank for automatic selection`,
      );
    }
    return {
      version,
      tag: `v${version}`,
      source: "requested",
      highestExisting: highestExisting ?? "",
    };
  }

  let candidate = packageSemver;
  if (channel === "stable" && semver.prerelease(candidate)) {
    candidate = semver.inc(candidate, "patch");
  }
  if (highestExisting && semver.gte(highestExisting, candidate)) {
    candidate = semver.inc(highestExisting, "patch");
  }
  while (existing.has(candidate)) candidate = semver.inc(candidate, "patch");

  return {
    version: candidate,
    tag: `v${candidate}`,
    source: candidate === packageSemver ? "package-version" : "auto-next-patch",
    highestExisting: highestExisting ?? "",
  };
}

export function artifactNames(version = rootPackageVersion()) {
  assertValidSemver(version, "artifact version");
  return [
    `research-observatory-${version}-windows-x64-setup.exe`,
    `research-observatory-${version}-windows-x64-portable.zip`,
    `research-observatory-${version}-linux-x64-portable.zip`,
    `research-observatory-${version}-linux-x64.deb`,
    `research-observatory-${version}-linux-x64.rpm`,
    `research-observatory-${version}-macos-arm64.zip`,
    `research-observatory-${version}-macos-x64.zip`,
  ];
}

export function releaseAssetNames(version = rootPackageVersion()) {
  return [
    ...artifactNames(version),
    "SHA256SUMS.txt",
    "release-manifest.json",
    "sbom.cdx.json",
  ];
}

export function windowsSetupName(version = rootPackageVersion()) {
  return artifactNames(version)[0];
}

export function validateSemver(version) {
  return Boolean(semver.valid(version));
}
