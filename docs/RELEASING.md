# Preparing and publishing a release

## Current hold: Android Web chatbox migration

The migration is **not ready to publish**. Preparing a tarball is useful now, but does not authorize a release, including a prerelease.

The source currently pins Crisp iOS **3.1.1** and Android **2.0.25**. The Android version still provides the existing native chatbox and notification integration; it is not the new Web chatbox implementation. Do not replace it with a floating `develop` dependency or infer notification readiness from successful source-level tests.

The repository examples and development dependencies currently use Expo 56. External Expo 58 qualification is not a substitute for validating the final packed module with its final Android SDK. Do not claim a new compatibility range until that matrix has been completed.

## Prepare a candidate without publishing

Use Node 24 (recommended) or Node 22, Yarn 4.7.0 through Corepack, **npm 11.19.1 or newer**, and `tar`. The packaging command refuses older npm before starting validation or creating an artifact directory. This is a maintainer-tool requirement, not a new consumer runtime requirement.

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

The public migration and push guides are included in the package. The Swift tests referenced by the podspec's `Migration` test spec remain included. Release scripts, internal readiness state and development artifacts are not distributed.

## Publication criteria

`.release-readiness.json` is a **manual, reviewed release gate**, not automatically inferred evidence. Every known criterion must be the boolean `true`; missing fields and string values are rejected. Keep all unproven criteria `false` and record supporting test results and maintainer approval in the release PR before changing them. Reset affected criteria, including publication approval, whenever a candidate changes; do not carry acknowledgments over to an unvalidated candidate.

| Criterion | Evidence required before acknowledging it |
| --- | --- |
| `androidOfficialSdk` | Official, complete, pinned Android release containing notifications; module and plugin use the same version and the final native APIs. |
| `sessionUpgrade` | Real in-place 2.x → 3.x upgrades preserving anonymous and identified conversations; logout, interrupted migration and account isolation checked. |
| `androidNotifications` | Authorized test Firebase setup; real FCM reception and tap/navigation in foreground, background and process-not-running states; SDK-managed/coexistence modes, no duplicate handling or interference with non-Crisp pushes. Do not equate Android force-stop with normal process death. |
| `reactNativeValidation` | Final tarball installed in representative Expo/RN apps on Android and iOS; documented compatibility, chat, lifecycle/uploads, session handling and notification behavior checked; APNs/device limitations recorded. |
| `licenseFile` | Authorized `LICENSE` supplied by the maintainers and included in the archive. The manifest declares MIT and README links to this file, but it is currently absent. Do not invent a copyright owner or license text. |
| `independentReview` | Independent review and release outcome check completed; blocking findings resolved. A self-review is not independent review. |
| `publicationApproved` | Explicit maintainer approval to publish this exact candidate after all other checks. |

```bash
yarn release:check
```

This command is expected to **fail while the hold is active**. It does not publish. The same gate protects `yarn release`, the source tree's `prepublishOnly` hook, and the tag-triggered workflow. CI also requires the tag to equal `v` plus the package version. These are repository safeguards, not npm account access controls; do not bypass them with a direct `npm publish` or `--ignore-scripts` outside the guarded workflow.

## Finalize only after the hold is lifted

1. Complete the native migration and device matrix. Rebuild and retest a fresh candidate after any source or dependency change.
2. Finalize the migration guide and release notes against the actual native API changes. `MIGRATION.md` currently covers moving from `react-native-crisp-chat-sdk`, not the new Web chatbox migration. Do not silently repurpose it.
3. Select the appropriate version bump with Changesets when the final compatibility contract is known. The packaging-only changeset does not decide the overall migration's version bump. Use `yarn version` only in the explicitly authorized release PR, never during ordinary candidate preparation.
4. Review all criteria with their evidence, including the authorized license file, independent review and publication approval. A passing CI does not set these flags.
5. Merge the approved release PR. From a clean checkout of its commit on `master`, follow the versioning/tagging procedure in the README. Do not tag the current development version or publish it locally.

## CI behavior

`Test and Build` runs the same non-publishing preparation on pushes and PRs, then retains the inspected archive and its report for seven days. It works while publication is blocked.

`Build and Release` starts on version tags but checks the criteria and exact tag/version match before preparing anything. Only a successful preparation enables its separate publishing job with npm OIDC permissions. That job rechecks the criteria and archive integrity, then publishes the **same inspected tarball**, not a new pack of the working directory.

The workflow files do not change remote repository settings. Maintainers must verify required checks and npm trusted publishing permissions before the eventual release. Uploading a candidate artifact is not an npm release.
