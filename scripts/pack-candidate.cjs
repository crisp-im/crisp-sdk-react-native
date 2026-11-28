const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseArgs } = require("node:util");

const requiredFiles = [
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "MIGRATION.md",
  "docs/API.md",
  "docs/PUSH_NOTIFICATIONS.md",
  "app.plugin.js",
  "expo-module.config.json",
  "plugin/build/withExpoCrisp.js",
  "plugin/build/withExpoCrisp.d.ts",
  "ios/ExpoCrispSdk.podspec",
  "ios/ExpoCrispSdkModule.swift",
  "ios/CrispAppDelegateSubscriber.swift",
  "ios/Tests/CrispMigrationTests.swift",
  "android/build.gradle",
  "android/src/main/AndroidManifest.xml",
  "android/src/main/java/expo/modules/crispsdk/ExpoCrispSdkModule.kt",
  "android/src/main/java/expo/modules/crispsdk/CrispPackage.kt",
];

const allowedFiles = [
  /^(package\.json|README\.md|LICENSE|CHANGELOG\.md|MIGRATION\.md|app\.plugin\.js|expo-module\.config\.json)$/,
  /^docs\/(API|PUSH_NOTIFICATIONS)\.md$/,
  /^(build|plugin\/build)\/[\w./-]+\.(js|d\.ts)(\.map)?$/,
  /^ios\/[\w-]+\.(swift|podspec)$/,
  /^ios\/Tests\/[\w-]+\.swift$/,
  /^android\/build\.gradle$/,
  /^android\/src\/main\/[\w./-]+\.(kt|java|xml|png|webp)$/,
];

function assertPackagingNpm(version) {
  const minimum = [11, 19, 1];
  const actual = /^\d+\.\d+\.\d+$/.test(version) ? version.split(".").map(Number) : [];
  const difference = minimum.findIndex((part, index) => actual[index] !== part);
  assert.ok(
    actual.length === 3 && (difference === -1 || actual[difference] > minimum[difference]),
    `Packaging requires npm >= 11.19.1 to honor --ignore-scripts (found ${version}). See docs/RELEASING.md.`,
  );
}

function validatePackage(report, manifest, expectedFiles = []) {
  assert.equal(report.name, manifest.name, "Packed package name differs from the source manifest");
  assert.equal(report.version, manifest.version, "Packed version differs from the source manifest");
  const files = report.files.map((file) => file.path);
  const fileSet = new Set(files);
  assert.equal(fileSet.size, files.length, "Duplicate paths in the archive");
  for (const required of [...requiredFiles, manifest.main, manifest.types, ...expectedFiles]) {
    assert.ok(fileSet.has(required), `Missing package file: ${required}`);
  }
  for (const file of files) {
    assert.ok(
      !file.split("/").some((segment) => segment.startsWith(".") || segment.startsWith("__")) &&
        allowedFiles.some((pattern) => pattern.test(file)),
      `Unexpected package file: ${file}`,
    );
    if (expectedFiles.length > 0 && /^(build|plugin\/build)\//.test(file)) {
      assert.ok(expectedFiles.includes(file.replace(/\.map$/, "")), `Stale build output: ${file}`);
    }
  }
}

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name.startsWith("__")) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(file) : entry.isFile() ? [file] : [];
  });
}

function expectedPackageFiles(root) {
  const builds = [
    ["src", "build"],
    ["plugin/src", "plugin/build"],
  ].flatMap(([source, output]) => {
    const directory = path.join(root, source);
    return collectFiles(directory)
      .filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".d.ts"))
      .flatMap((file) => {
        const name = path
          .relative(directory, file)
          .replace(/\.tsx?$/, "")
          .split(path.sep)
          .join("/");
        return [`${output}/${name}.js`, `${output}/${name}.d.ts`];
      });
  });
  const iosFiles = ["ios", "ios/Tests"].flatMap((directory) =>
    fs
      .readdirSync(path.join(root, directory), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(swift|podspec)$/.test(entry.name))
      .map((entry) => path.join(root, directory, entry.name)),
  );
  const nativeFiles = [...iosFiles, ...collectFiles(path.join(root, "android/src/main"))]
    .filter((file) => /\.(swift|podspec|kt|java|xml|png|webp)$/.test(file))
    .map((file) => path.relative(root, file).split(path.sep).join("/"));
  return [...builds, ...nativeFiles];
}

function prepareCandidate(outputDirectory) {
  const root = path.resolve(__dirname, "..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assertPackagingNpm(execFileSync("npm", ["--version"], { encoding: "utf8" }).trim());
  const destination = outputDirectory
    ? path.resolve(outputDirectory)
    : fs.mkdtempSync(path.join(os.tmpdir(), "crisp-candidate-"));
  const relativeDestination = path.relative(root, destination);
  assert.ok(
    relativeDestination.startsWith(`..${path.sep}`) || path.isAbsolute(relativeDestination),
    "Candidate output must be outside the repository",
  );
  if (outputDirectory) fs.mkdirSync(destination);
  const commandOptions = {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, CI: "1", EXPO_NONINTERACTIVE: "1" },
  };

  console.log("Validating the candidate; publication criteria are not changed.");
  execFileSync("yarn", ["release:validate"], commandOptions);
  const archive = path.join(destination, `${manifest.name}-${manifest.version}.tgz`);
  const [report] = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", destination], {
      ...commandOptions,
      stdio: ["ignore", "pipe", "inherit"],
      encoding: "utf8",
    }),
  );
  validatePackage(report, manifest, expectedPackageFiles(root));
  const integrity = `sha512-${createHash("sha512").update(fs.readFileSync(archive)).digest("base64")}`;
  assert.equal(report.integrity, integrity, "Archive integrity mismatch");

  const extracted = path.join(destination, "extracted");
  fs.mkdirSync(extracted);
  execFileSync("tar", ["-xzf", archive, "-C", extracted], commandOptions);
  const packedRoot = path.join(extracted, "package");
  const packedManifest = JSON.parse(fs.readFileSync(path.join(packedRoot, "package.json"), "utf8"));
  assert.equal(packedManifest.version, manifest.version, "Archive manifest version mismatch");
  for (const file of expectedPackageFiles(root)) {
    assert.ok(fs.existsSync(path.join(packedRoot, file)), `File missing after extraction: ${file}`);
  }
  execFileSync(
    process.execPath,
    [
      "-e",
      `const assert = require('node:assert/strict');
const plugin = require(process.argv[1]).default;
assert.equal(typeof plugin, 'function');
const config = { name: 'Package smoke test', slug: 'package-smoke-test' };
assert.deepEqual(plugin(config), config);
assert.throws(() => plugin(config, { notifications: { enabled: true } }), /websiteId is required/);`,
      path.join(packedRoot, "app.plugin.js"),
    ],
    {
      ...commandOptions,
      cwd: packedRoot,
      env: { ...commandOptions.env, NODE_PATH: path.join(root, "node_modules") },
    },
  );

  const warnings = report.files.some((file) => file.path === "LICENSE")
    ? []
    : ["LICENSE is missing. Supply an authorized license before clearing the release gate."];
  fs.writeFileSync(
    path.join(destination, "candidate.json"),
    `${JSON.stringify({ purpose: "validation-only", publicationAttempted: false, archive, integrity, warnings, package: report }, null, 2)}\n`,
  );
  for (const warning of warnings) console.warn(warning);
  console.log(
    `Validated candidate: ${archive}\nIntegrity: ${integrity}\nNot published. Native validation and release approval remain separate.`,
  );
}

if (require.main === module) {
  try {
    const { values } = parseArgs({ options: { "out-dir": { type: "string" } } });
    prepareCandidate(values["out-dir"]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { requiredFiles, validatePackage, expectedPackageFiles, assertPackagingNpm };
