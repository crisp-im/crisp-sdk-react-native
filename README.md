<p align="center">
  <a href="https://crisp.chat/en/sdk/react-native/">
    <img width="659" alt="crisp-banner" src="https://github.com/user-attachments/assets/ac273b9a-5713-4fb6-ab1e-7214a018731e" />
  </a>
  <br />
  <h3 align="center">crisp-sdk-react-native</h3>
  <p align="center">The official Crisp SDK for React Native &mdash; Add live chat to your Expo & React Native apps</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/crisp-sdk-react-native">
    <img src="https://img.shields.io/npm/v/crisp-sdk-react-native.svg" alt="npm version" />
  </a>
  <a href="https://github.com/crisp-im/crisp-sdk-react-native/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/crisp-sdk-react-native.svg" alt="license" />
  </a>
  <img src="https://img.shields.io/badge/Expo%20SDK-54%2B-blue" alt="Expo SDK 54+" />
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey" alt="platforms" />
</p>

<p align="center">
  <a href="https://crisp.chat/en/sdk/"><b>See Crisp Support Chat SDKs</b></a> &nbsp;&bull;&nbsp;
  <a href="https://crisp.chat/en/sdk/react-native/"><b>React Native Support Chat SDK</b></a> &nbsp;&bull;&nbsp;
  <a href="https://docs.crisp.chat/guides/chatbox-sdks/react-native-sdk/"><b>Developer Docs</b></a>
</p>

---

<p align="center"><b>Trusted by</b></p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/4b824e2a-018f-42a5-850e-34cb588adeb2" alt="Fruitz" height="40" align="center" />
  <b>Fruitz</b>
  &nbsp;&middot;&nbsp;
  and many more companies rely on Crisp to power their in-app customer support.
</p>

---

<p align="center">
  <b>Demo</b>
</p>

<!-- TODO: Upload docs/Demo-Crisp-React-Native.mp4 via GitHub's web editor (drag-and-drop) and replace the src below with the generated URL -->
<div align="center">
  <video src="https://github.com/user-attachments/assets/ac64f6f1-91ae-4804-93e5-b747145d81fe" controls width="300"></video>
</div>

---

## Features

- Live chat with the Crisp chatbox, built on Crisp iOS 3.1.1 and Crisp Android 3.0.0beta3
- User identification, session data, segments and timeline events
- Helpdesk search and articles, bot scenarios and operator messages
- A React hook for session, chat, message, notification and log events
- Push notifications through the Expo config plugin, alone or next to `expo-notifications`, Firebase or OneSignal
- TypeScript types for the whole API

> [!WARNING]
> **Minimum Expo SDK version**
>
> | SDK Version | Expo Compatibility |
> |---|---|
> | **0.5.0+** (`next` tag) | Expo SDK 54+ (`compileSdk` 36, AGP 8.11+ and Kotlin 2.1.20+ required by Crisp Android SDK 3.x) |
> | **0.2.0 to 0.4.x** | Expo SDK 54+ (AGP 8.9.1+ required by Crisp Android SDK 2.0.16+) |
> | **0.1.4** | Expo SDK 51+ |
>
> On Expo 53 or older, pin to version 0.1.4:
> ```bash
> npx expo install crisp-sdk-react-native@0.1.4
> ```

> [!NOTE]
> Version 0.5 is built on the native Crisp iOS 3.x and Android 3.x SDKs, which embed the Crisp
> web chatbox. It is published on the `next` npm tag while Crisp Android 3.x is in beta. To upgrade from 0.4, see the
> [migration guide](./MIGRATION.md#upgrading-to-05-crisp-web-chatbox-sdks).

## Quick start

Expo Go is not supported: the SDK uses native code, so you need a [development build](https://docs.expo.dev/develop/development-builds/introduction/). `npx expo run:ios` and `npx expo run:android` make one; `expo-dev-client` is optional.

**1. Install the package.** With another package manager, use `bunx`, `pnpm dlx` or `yarn dlx` instead of `npx`.

```bash
npx expo install crisp-sdk-react-native@next
```

This also adds `crisp-sdk-react-native` to `plugins` in `app.json`. Without options the config plugin changes nothing; it is only needed for [push notifications](./docs/PUSH_NOTIFICATIONS.md).

**2. Add the iOS usage descriptions** to `app.json`. Crisp iOS 3.x requires them before opening the chat, even for text-only conversations: without them, it shows a configuration screen instead of the chat. The config plugin does not add them. They do not request any permission; use wording suited to your app.

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Allow access to your camera to share photos and make video calls with support.",
        "NSMicrophoneUsageDescription": "Allow access to your microphone to send voice messages and make calls with support."
      }
    }
  }
}
```

**3. Configure Crisp once, then open the chat.** [Sign up](https://app.crisp.chat/initiate/signup/) or log in to Crisp, then copy your Website ID from **Settings** > **Website Settings** > **Setup instructions**.

```tsx
import { useEffect } from "react";
import { Button } from "react-native";
import { configure, show } from "crisp-sdk-react-native";

export default function App() {
  useEffect(() => configure("YOUR_WEBSITE_ID"), []);
  return <Button title="Chat with us" onPress={() => show()} />;
}
```

In an Expo Router app, call `configure()` in `app/_layout.tsx`.

**4. Build and run** the native app. Expo SDK 54 and newer already use `compileSdk` 36 or newer, AGP 8.11 or newer and Kotlin 2.1.20 or newer, so Android needs no extra build settings. The config plugin also adjusts the generated Podfile so that Xcode 27 accepts the Crisp resource bundles, see the [migration guide](./MIGRATION.md#5-if-xcode-rejects-the-crisp-resource-bundles).

```bash
npx expo run:ios # or: npx expo run:android
```

### Bare React Native

Requirements: React Native 0.81+, iOS 15.1+, Android `minSdkVersion` 24+ and `compileSdkVersion` 36+, Android Gradle Plugin 8.11+, Kotlin 2.1.20+, Node.js 20.19.4+. If Xcode 27 rejects the Crisp resource bundles, add the Podfile workaround from the [migration guide](./MIGRATION.md#5-if-xcode-rejects-the-crisp-resource-bundles).

```bash
npx install-expo-modules@latest
npm install crisp-sdk-react-native@next
cd ios && pod install
```

[`install-expo-modules`](https://docs.expo.dev/bare/installing-expo-modules/) configures your iOS and Android projects for Expo modules. Add the camera and microphone descriptions to your app target's `Info.plist`, as shown in the [migration guide](./MIGRATION.md#3-update-your-configuration), then call `configure()` and `show()` as above.

## Usage

**Identify the user.** A token ID restores the conversation across reinstalls and devices.

```tsx
import { resetSession, setTokenId, setUserEmail, setUserNickname } from "crisp-sdk-react-native";

export function onLogin(user: { id: string; email: string; name: string }) {
  setTokenId(user.id);
  setUserEmail(user.email);
  setUserNickname(user.name);
}

export function onLogout() {
  setTokenId(null);
  resetSession();
}
```

**Add session data and events**, shown to operators in the Crisp dashboard:

```tsx
import { CrispSessionEventColors, pushSessionEvent, setSessionSegments, setSessionString } from "crisp-sdk-react-native";

setSessionString("plan", "premium");
setSessionSegments(["premium", "beta-tester"]);
pushSessionEvent("Purchase completed", CrispSessionEventColors.GREEN);
```

**Listen to events** with the `useCrispEvents` hook, which unsubscribes on unmount:

```tsx
import { useCrispEvents } from "crisp-sdk-react-native";

export function CrispListener() {
  useCrispEvents({
    onSessionLoaded: (sessionId) => console.log("Crisp session:", sessionId),
    onMessageReceived: (message) => console.log("Received:", message.content),
  });
  return null;
}
```

Helpdesk, bot scenarios, operator messages, debug logs and every type are covered in the [API reference](./docs/API.md).

## Platform differences

- Android opens the chatbox in a bottom sheet. `openChat()`, which opens the chatbox on its Chat tab on iOS, throws `ERR_CRISP_UNSUPPORTED` on Android: call `show()` instead.
- `getSessionIdentifier()` returns `null` on Android unless the chatbox is shown: use `onSessionLoaded`. On iOS, it returns the identifier once the session has loaded.
- On Android, `showMessage()` and `runBotScenario()` wait for a chatbox to be ready.
- The `content` of non-text messages is an empty string on both platforms.

See the full table in the [API reference](./docs/API.md#platform-differences) and the [0.5 behavior changes](./MIGRATION.md#4-review-the-behavior-changes).

## Troubleshooting

- **Nothing happens after `show()`**: call `configure()` with a valid Website ID first. On iOS, do not close a modal and open the chat in the same handler: see [opening the chatbox](./docs/API.md#opening-the-chatbox).
- **iOS shows a configuration screen instead of the chat**: add the [usage descriptions](#quick-start) and rebuild.
- **The conversation is lost after a reinstall**: call `setTokenId()` with a unique user ID.
- **Push notifications do not arrive**: see [push troubleshooting](./docs/PUSH_NOTIFICATIONS.md#troubleshooting).
- **Xcode 27 rejects the `CrispChatBox` resource bundle**: see the [Podfile workaround](./MIGRATION.md#5-if-xcode-rejects-the-crisp-resource-bundles).
- **iOS build fails with missing `CrispSDK.session.*` symbols**: [clear `DerivedData`](./MIGRATION.md#ios-build-fails-locally-with-missing-crispsdksession-symbols).

## Documentation

- [API reference](./docs/API.md): every function, hook, enum and type, with platform notes
- [Push notifications](./docs/PUSH_NOTIFICATIONS.md): config plugin options, coexistence mode, APNs and Firebase setup
- [Migration guide](./MIGRATION.md): upgrading to 0.5, and migrating from `react-native-crisp-chat-sdk`
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md): development setup, checks and changesets
- [Releasing](./docs/RELEASING.md): release process, for maintainers

## Example apps

| App | Directory | Description |
| --- | --- | --- |
| **Expo** | [`example/`](./example) | Expo Router app with push notifications (coexistence mode with `expo-notifications`), event listeners and all SDK features |
| **Bare React Native** | [`bare-example/`](./bare-example) | React Native CLI app using the SDK without the Expo managed workflow |

Add your Website ID to their `.env` file, then follow [CONTRIBUTING.md](./CONTRIBUTING.md#run-the-example-apps).

## Resources

- [Crisp SDK Overview](https://crisp.chat/en/sdk/): all Crisp SDKs
- [React Native SDK Page](https://crisp.chat/en/sdk/react-native/): product page for this SDK
- [Crisp Help Center](https://help.crisp.chat/)
- [Crisp Developer Documentation](https://docs.crisp.chat/)
- [iOS SDK Documentation](https://docs.crisp.chat/guides/chatbox-sdks/ios-sdk/)
- [Android SDK Documentation](https://docs.crisp.chat/guides/chatbox-sdks/android-sdk/)

## License

MIT - See [LICENSE](./LICENSE) for details.
