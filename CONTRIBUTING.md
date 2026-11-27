# Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/crisp-im/crisp-sdk-react-native/issues).

## Set up the repository

Use Node.js 24 (`.nvmrc`, as in CI; it ships the npm 11 that `yarn release:prepare` needs). The repository uses Yarn 4.7.0 through Corepack (`packageManager` in `package.json`). Do not run `npm install` at the root: it can replace the Yarn lockfile with an incompatible format.

```bash
git clone https://github.com/crisp-im/crisp-sdk-react-native.git
cd crisp-sdk-react-native
corepack enable
corepack prepare yarn@4.7.0 --activate
yarn install --immutable
```

Create a dedicated branch for your change.

## Validate your changes

| Command | What it does |
| --- | --- |
| `yarn build` | Builds the module (`src/` to `build/`). |
| `yarn build:plugin` | Builds the config plugin (`plugin/src/` to `plugin/build/`). |
| `yarn test` | Runs the Jest tests. |
| `yarn lint` | Lints the module. `yarn lint plugin` lints the config plugin. |
| `yarn format` | Formats the repository with Biome. |
| `yarn test:release` | Runs the release tooling tests. |
| `yarn release:validate` | Runs the module, plugin and scripts lint, both test suites and both builds. |

Run `yarn format` and `yarn release:validate` before opening a pull request. CI (`.github/workflows/test.yml`) runs `yarn release:prepare`: the same checks, then a pack and inspection of the npm tarball, without publishing it.

## Run the example apps

For native changes, test the Expo example app on the affected platforms. Both example apps use [Bun](https://bun.sh) and read your Website ID from `EXPO_PUBLIC_CRISP_WEBSITE_ID` in a `.env` file.

Expo app (`example/`, Expo Router, notifications in coexistence mode with `expo-notifications`):

```bash
cd example
cp .env.example .env # then set EXPO_PUBLIC_CRISP_WEBSITE_ID
bun install
npx expo prebuild --clean
bun run ios # or: bun run android
```

Bare React Native app (`bare-example/`, React Native CLI with Expo Modules):

```bash
cd bare-example
cp .env.example .env # then set EXPO_PUBLIC_CRISP_WEBSITE_ID
bun install
cd ios && bundle install && bundle exec pod install && cd ..
bun run ios # or: bun run android
```

## Add a changeset

Changes that affect the published package, such as fixes, features or dependency updates, need a changeset:

```bash
yarn changeset
```

Pick the version bump: `patch` for fixes and compatible dependency updates, `minor` for backward-compatible features, `major` for breaking changes. Commit the generated `.changeset/*.md` file with your change. Documentation, tests and internal maintenance that do not change the published package need no changeset.

`master` holds the stable `0.4.x` line. The `next` branch is in Changesets prerelease mode (`.changeset/pre.json`) and releases `1.0.0-next.N` on the `next` npm tag until the stable Crisp Android SDK ships. Open changes for 1.0 against `next`, and fixes for `0.4.x` against `master`.

Do not update the package version, changelog or Git tags, and do not run the release commands: maintainers handle versioning and publication. See the [release guide](./docs/RELEASING.md).
