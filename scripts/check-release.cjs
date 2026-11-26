const fs = require("node:fs");
const path = require("node:path");

const releaseCriteria = {
  androidOfficialSdk: "Official Android SDK with notifications pinned in the module and plugin",
  sessionUpgrade: "Real 2.x to 3.x upgrade and session isolation validated",
  androidNotifications: "Real FCM delivery, navigation and both notification modes validated",
  reactNativeValidation: "Final React Native/Expo package validated on Android and iOS",
  licenseFile: "Authorized LICENSE file included in the package",
  independentReview: "Independent review completed with blocking findings resolved",
  publicationApproved: "Maintainer explicitly approved publication of this candidate",
};

// A prerelease on the "next" tag exists precisely while the Android SDK is still a beta
const stableOnlyCriteria = new Set(["androidOfficialSdk"]);

function assertReleaseReady(readiness, version, tag) {
  const prerelease = version.includes("-");
  const blocked = Object.entries(releaseCriteria)
    .filter(([criterion]) => !(prerelease && stableOnlyCriteria.has(criterion)))
    .filter(([criterion]) => readiness?.[criterion] !== true)
    .map(([criterion, description]) => `${criterion}: ${description}`);

  if (tag !== undefined && tag !== `v${version}`) {
    blocked.push(`Tag ${JSON.stringify(tag)} does not match package version v${version}`);
  }

  if (blocked.length > 0) {
    throw new Error(`Publication blocked:\n- ${blocked.join("\n- ")}\nSee docs/RELEASING.md.`);
  }
}

// npm 11 refuses to publish a prerelease without --tag: 0.5.0-next.0 goes to "next", 0.5.0 to "latest"
function npmDistTag(version) {
  const prerelease = /^\d+\.\d+\.\d+-([^.+]+)/.exec(version)?.[1];
  if (prerelease === undefined) return "latest";
  if (!/^[a-z][a-z0-9-]*$/i.test(prerelease) || prerelease === "latest") {
    throw new Error(
      `Prerelease ${version} must start with a dist-tag name, such as ${version.split("-")[0]}-next.0`,
    );
  }
  return prerelease;
}

if (require.main === module) {
  try {
    if (process.argv.length > 3) {
      throw new Error("Usage: yarn release:check [tag]");
    }
    const root = path.resolve(__dirname, "..");
    const readiness = JSON.parse(
      fs.readFileSync(path.join(root, ".release-readiness.json"), "utf8"),
    );
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    assertReleaseReady(readiness, manifest.version, process.argv[2]);
    if (!fs.existsSync(path.join(root, "LICENSE"))) {
      throw new Error("Publication blocked: the authorized LICENSE file is missing.");
    }
    console.log("Release criteria acknowledged. This command does not publish anything.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { assertReleaseReady, npmDistTag, releaseCriteria };
