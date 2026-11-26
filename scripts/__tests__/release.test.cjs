const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { assertReleaseReady, npmDistTag, releaseCriteria } = require("../check-release.cjs");
const { requiredFiles, validatePackage, assertPackagingNpm } = require("../pack-candidate.cjs");

const ready = Object.fromEntries(
  Object.keys(releaseCriteria).map((criterion) => [criterion, true]),
);
const manifest = {
  name: "crisp-sdk-react-native",
  version: "0.4.4",
  main: "build/index.js",
  types: "build/index.d.ts",
};
const packedFiles = [...requiredFiles, manifest.main, manifest.types];
const report = (files = packedFiles) => ({
  ...manifest,
  files: files.map((file) => ({ path: file })),
});

test("packaging refuses npm versions that have not been qualified for script-free packing", () => {
  for (const version of ["10.9.3", "10.9.8", "11.18.0", "11.19.0", "11.19.1-beta.1", "unknown"]) {
    assert.throws(() => assertPackagingNpm(version), /Packaging requires npm/);
  }
  for (const version of ["11.19.1", "11.19.2", "11.20.0", "12.0.0"]) {
    assert.doesNotThrow(() => assertPackagingNpm(version));
  }
});

test("all criteria must be explicitly acknowledged", () => {
  assert.doesNotThrow(() => assertReleaseReady(ready, manifest.version));
  assert.doesNotThrow(() => assertReleaseReady(ready, manifest.version, `v${manifest.version}`));
  assert.throws(() => assertReleaseReady(null, manifest.version), /Publication blocked/);
});

for (const criterion of Object.keys(releaseCriteria)) {
  test(`${criterion} cannot be skipped or truthy-coerced`, () => {
    for (const value of [false, undefined, "true", 1]) {
      assert.throws(
        () => assertReleaseReady({ ...ready, [criterion]: value }, manifest.version),
        new RegExp(criterion),
      );
    }
  });
}

test("prereleases do not require a stable Android SDK, but every other criterion", () => {
  const prerelease = { ...ready, androidOfficialSdk: false };
  assert.doesNotThrow(() => assertReleaseReady(prerelease, "0.5.0-next.0", "v0.5.0-next.0"));
  assert.throws(() => assertReleaseReady(prerelease, "0.5.0", "v0.5.0"), /androidOfficialSdk/);
  for (const criterion of Object.keys(releaseCriteria).filter(
    (name) => name !== "androidOfficialSdk",
  )) {
    assert.throws(
      () => assertReleaseReady({ ...prerelease, [criterion]: false }, "0.5.0-next.0"),
      new RegExp(criterion),
    );
  }
});

test("tag must match the package version exactly", () => {
  for (const tag of ["", manifest.version, "v9.9.9", `v${manifest.version}\n`]) {
    assert.throws(() => assertReleaseReady(ready, manifest.version, tag), /does not match/);
  }
});

test("prereleases publish to the dist-tag named by their identifier", () => {
  assert.equal(npmDistTag("0.5.0"), "latest");
  assert.equal(npmDistTag("0.5.0-next.0"), "next");
  assert.equal(npmDistTag("1.0.0-beta.2"), "beta");
  assert.equal(npmDistTag("0.5.0-next.1+build.7"), "next");
  for (const version of ["0.5.0-0", "0.5.0-1.next", "0.5.0-latest.0"]) {
    assert.throws(() => npmDistTag(version), /must start with a dist-tag name/);
  }
});

test("the CLI enforces the actual readiness file without publishing", () => {
  const root = path.resolve(__dirname, "../..");
  const readiness = JSON.parse(fs.readFileSync(path.join(root, ".release-readiness.json"), "utf8"));
  const check = () =>
    execFileSync(process.execPath, [path.resolve(__dirname, "../check-release.cjs")], {
      stdio: "pipe",
    });
  if (
    Object.keys(releaseCriteria).every((criterion) => readiness[criterion] === true) &&
    fs.existsSync(path.join(root, "LICENSE"))
  ) {
    assert.match(check().toString(), /does not publish anything/);
  } else {
    assert.throws(
      check,
      (error) => error.status === 1 && error.stderr.toString().includes("Publication blocked"),
    );
  }
});

test("complete candidate including the podspec test sources is accepted", () => {
  assert.doesNotThrow(() => validatePackage(report(), manifest));
});

for (const file of packedFiles) {
  test(`missing ${file} is rejected`, () => {
    assert.throws(
      () => validatePackage(report(packedFiles.filter((entry) => entry !== file)), manifest),
      /Missing package file/,
    );
  });
}

for (const file of [
  "aidd_docs/plan.md",
  ".release-readiness.json",
  ".env",
  "scripts/check-release.cjs",
  "android/local.properties",
  "android/build/outputs/classes.jar",
  "android/src/main/google-services.json",
  "android/src/main/debug.keystore",
  "build/__tests__/index.js",
  "build/../../secret.js",
  "build/.private.js",
  "ios/Pods/Dependency.swift",
]) {
  test(`unexpected ${file} is rejected`, () => {
    assert.throws(
      () => validatePackage(report([...packedFiles, file]), manifest),
      /Unexpected package file/,
    );
  });
}

test("duplicate archive paths are rejected", () => {
  assert.throws(
    () => validatePackage(report([...packedFiles, manifest.main]), manifest),
    /Duplicate paths/,
  );
});

test("wrong package identity is rejected", () => {
  assert.throws(
    () => validatePackage({ ...report(), version: "9.9.9" }, manifest),
    /Packed version/,
  );
  assert.throws(
    () => validatePackage({ ...report(), name: "another-package" }, manifest),
    /Packed package name/,
  );
});

test("source inventory rejects stale builds and permits their matching maps", () => {
  const expected = packedFiles.filter((file) => /^(build|plugin\/build)\//.test(file));
  assert.doesNotThrow(() =>
    validatePackage(report([...packedFiles, `${manifest.main}.map`]), manifest, expected),
  );
  assert.throws(
    () => validatePackage(report([...packedFiles, "build/removed.js"]), manifest, expected),
    /Stale build output/,
  );
  assert.throws(
    () => validatePackage(report(), manifest, [...expected, "build/new.js"]),
    /Missing package file/,
  );
});
