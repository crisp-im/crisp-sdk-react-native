# Preparing and publishing a release

## Status of the 0.5 migration

The source pins Crisp iOS **3.1.1** and Android **3.0.0beta3**, the Web chatbox SDKs. Crisp Android 3.0.0beta3 requires `compileSdk` 36, Android Gradle Plugin 8.11 or newer and Kotlin 2.1.20 or newer, so the package requires Expo SDK 54 or newer (React Native 0.81 or newer) through its peer dependencies. The development dependencies and examples use Expo SDK 58.

Evidence gathered so far, to review in the release PR before acknowledging the criteria below:

- Android: real FCM pushes on a physical device, from a release build of the packed module in an Expo 58 app, in both notification modes: foreground, background and process not running, with the tap opening the conversation, and no notification after logout. Interference with non-Crisp pushes in coexistence mode is not validated on a device.
- Expo 54.0.38 / React Native 0.81.5 with a packed module built against Crisp Android 3.0.0beta3 (device checks on the last 3.0.0beta3 snapshot, whose classes only differ from the published artifact by the version string, and a release build against the published artifact): on Android, a release build on a physical device opens the chatbox, emits the chat, session and message events, switches users, and delivers real FCM pushes in background and with the process not running, with the tap opening the conversation. On iOS, `expo prebuild --clean` adds the Podfile step of the config plugin once, and the Release build launches, configures Crisp and opens the chatbox on an iOS 18.6 simulator. Expo 54 apps built with the iOS 27 SDK crash at launch on iOS 27, without the UIScene lifecycle that Expo SDK 58 adopts; this is unrelated to the module.
- iOS: every public export exercised on an iOS 27 simulator, with simulated pushes in both modes, including a tap that launches the app and coexistence with a delegate that forwards back to Crisp as React Native Firebase does. Real APNs delivery is not validated.

`androidOfficialSdk` is required for a stable release only: a prerelease on `next` exists precisely while Crisp Android 3.x is in beta. Every other criterion applies to prereleases too.

## Prerelease channel

While Crisp Android 3.x is in beta, the repository is in Changesets prerelease mode on the `next` tag (`.changeset/pre.json`): `yarn version` produces `0.5.0-next.N`. The `Build and Release` workflow publishes a prerelease to the npm dist-tag named by its identifier (`next`), and a stable version to `latest`, as npm 11 refuses to publish a prerelease without an explicit tag. The publication criteria apply to prereleases too, except `androidOfficialSdk`.

When the stable Android SDK is released and validated, leave prerelease mode in the release PR with `yarn changeset pre exit`, then `yarn version`.

## Prepare a candidate without publishing

Use the latest Node 24 (Node 22 ships npm 10), Yarn 4.7.0 through Corepack, **npm 11.19.1 or newer**, and `tar`. The packaging command refuses older npm before starting validation or creating an artifact directory. This is a maintainer-tool requirement, not a new consumer runtime requirement.

```bash
yarn install --immutable
npm --version
yarn release:prepare
```

The command runs source and plugin lint, release-tool tests, the existing Jest suite, and both TypeScript builds. It then creates an archive in a new temporary directory outside the repository. To retain it at a known location, pass an **absolute, not-yet-existing directory** whose parent exists:

```bash
yarn release:prepare --out-dir /tmp/crisp-release-candidate
```

It inspects the real archive with npm, checks required files and the source inventory, rejects unexpected files and stale builds, verifies its SHA-512 integrity, and loads the config plugin from the extracted package using the workspace's installed Expo dependency. The output directory contains the `.tgz`, extracted contents and `candidate.json`.

This is a packaging smoke test, **not** a native build, device test, push test or fresh dependency-resolution test. It does not modify the package version, changelog, release criteria or Git tags, and does not publish. It keeps the current source version, so do not confuse this local archive with the same numbered version already available on npm.

npm creates and inspects the archive with `--ignore-scripts`; Yarn remains the dependency manager and runs the validations. npm 10.9.3 and 10.9.8 still execute the repository's `prepare` hook during directory packing despite that flag. The packaging tool requires the qualified newer npm rather than patching that hook or silently rewriting project configuration. Yarn's packing behavior differs from npm for nested paths and README files, so it is not used as a substitute.

The public migration, push and API guides are included in the package; this maintainer guide is not. The Swift tests referenced by the podspec's `Migration` test spec remain included. Release scripts, internal readiness state and development artifacts are not distributed.

publint and Are the Types Wrong report that `build/*.js` uses ESM syntax while `package.json` has no `type` field. This is the standard output of `expo-module-scripts`, unchanged since 0.4.x: Metro and TypeScript resolve the package through `main` and `types`. Adding `type` or `exports` would change how bundlers and the config plugin (`app.plugin.js`) resolve the package, so it is out of scope for this migration.

## Publication criteria

`.release-readiness.json` is a **manual, reviewed release gate**, not automatically inferred evidence. Every known criterion must be the boolean `true`; missing fields and string values are rejected. Keep all unproven criteria `false` and record supporting test results and maintainer approval in the release PR before changing them. Reset affected criteria, including publication approval, whenever a candidate changes; do not carry acknowledgments over to an unvalidated candidate.

| Criterion | Evidence required before acknowledging it |
| --- | --- |
| `androidOfficialSdk` | Stable releases only. Official, complete, pinned Android release containing notifications; module and plugin use the same version and the final native APIs. |
| `sessionUpgrade` | Real in-place 2.x → 3.x upgrades preserving anonymous and identified conversations; logout, interrupted migration and account isolation checked. |
| `androidNotifications` | Authorized test Firebase setup; real FCM reception and tap/navigation in foreground, background and process-not-running states; SDK-managed/coexistence modes, no duplicate handling or interference with non-Crisp pushes. Do not equate Android force-stop with normal process death. |
| `reactNativeValidation` | Final tarball installed in representative Expo/RN apps on Android and iOS; documented compatibility, chat, lifecycle/uploads, session handling and notification behavior checked; APNs/device limitations recorded. |
| `licenseFile` | Authorized `LICENSE` supplied by the maintainers and included in the archive. The manifest declares MIT and README links to this file. Do not invent a copyright owner or license text. |
| `independentReview` | Independent review and release outcome check completed; blocking findings resolved. A self-review is not independent review. |
| `publicationApproved` | Explicit maintainer approval to publish this exact candidate after all other checks. |

```bash
yarn release:check
```

This command fails until every required criterion is acknowledged. It does not publish. The same gate protects `yarn release`, the source tree's `prepublishOnly` hook, and the tag-triggered workflow. CI also requires the tag to equal `v` plus the package version. These are repository safeguards, not npm account access controls; do not bypass them with a direct `npm publish` or `--ignore-scripts` outside the guarded workflow.

## Finalize a release

1. Complete the native migration and device matrix. Rebuild and retest a fresh candidate after any source or dependency change.
2. Check the migration guide (`MIGRATION.md`, "Upgrading to 0.5") and the `web-chatbox-sdks` changeset against the final native API changes.
3. The `web-chatbox-sdks` changeset sets a minor bump, released as `0.5.0-next.N` while prerelease mode is active. Use `yarn version` only in the explicitly authorized release PR, never during ordinary candidate preparation.
4. Review all criteria with their evidence, including the authorized license file, independent review and publication approval. A passing CI does not set these flags.
5. Merge the approved release PR. From a clean checkout of its commit on `master`, follow [Version, tag and publish](#version-tag-and-publish). Do not tag the current development version or publish it locally.

## Version, tag and publish

**Do not run these steps before the release gate passes.** First complete and review every criterion in `.release-readiness.json`, including explicit publication approval. `yarn release:check` must succeed.

Releases are prepared with Changesets and published to npm by GitHub Actions. Start from a dedicated release branch based on the latest `master`:

```bash
git switch master
git pull --ff-only origin master
corepack enable
corepack prepare yarn@4.7.0 --activate
yarn install --immutable
yarn changeset status
yarn version
```

The version command consumes the pending changesets, updates `package.json` and `CHANGELOG.md`, and removes the consumed `.changeset/*.md` files. Review these changes, run `yarn release:validate`, and merge them through a release pull request.

After the release pull request is merged, tag the resulting commit on `master`:

```bash
git switch master
git pull --ff-only origin master
VERSION=$(node -p "require('./package.json').version")
git status --short
git tag -a "v${VERSION}" -m "v${VERSION}"
git push origin "v${VERSION}"
```

Only create the tag when the working tree is clean and the version does not already exist on npm. Pushing the tag triggers the `Build and Release` workflow, which checks the release criteria and tag/version match, runs tests and builds, and publishes the inspected tarball with npm provenance. Do not run `npm publish` locally.

Once the workflow succeeds, verify the published version:

```bash
npm view "crisp-sdk-react-native@${VERSION}" version
```

## CI behavior

`Test and Build` runs the same non-publishing preparation on pushes and PRs, then retains the inspected archive and its report for seven days. It works while publication is blocked.

`Build and Release` starts on version tags but checks the criteria and exact tag/version match before preparing anything. Only a successful preparation enables its separate publishing job with npm OIDC permissions. That job rechecks the criteria and archive integrity, then publishes the **same inspected tarball**, not a new pack of the working directory.

The workflow files do not change remote repository settings. Maintainers must verify required checks and npm trusted publishing permissions before the eventual release. Uploading a candidate artifact is not an npm release.
