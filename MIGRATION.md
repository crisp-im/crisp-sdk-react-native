# Migration Guide

- [Upgrading to 0.5 (Crisp web chatbox SDKs)](#upgrading-to-05-crisp-web-chatbox-sdks)
- [Migrating from `react-native-crisp-chat-sdk`](#migrating-from-react-native-crisp-chat-sdk)

## Upgrading to 0.5 (Crisp web chatbox SDKs)

Version 0.5 moves to Crisp iOS **3.1.1** and Crisp Android **3.0.0beta2**, the web chatbox SDKs. While the Android SDK is in beta, it is published on the `next` npm tag.

### 1. Check the requirements

- **Expo SDK 58 or newer** (React Native 0.88 or newer). Crisp Android 3.x and its AndroidX dependencies require `compileSdk` 37 and Android Gradle Plugin 9.1 or newer, which Expo SDK 58 is the first to provide. On Expo SDK 54 to 57, stay on `crisp-sdk-react-native@0.4`.
- iOS 14 or newer.

### 2. Install and rebuild

```bash
npx expo install crisp-sdk-react-native@next
npx expo prebuild --clean
```

The config plugin options do not change. The plugin removes the Crisp Android 2.x dependencies that previous versions added to `android/app/build.gradle`.

### 3. Update your configuration

**iOS: add the camera and microphone usage descriptions.** Crisp iOS 3.x requires them before opening the chat, including text-only conversations. Without them, the native SDK displays a configuration screen instead of the chat:

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

In a bare React Native app, add the same keys to the application target's `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Allow access to your camera to share photos and make video calls with support.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Allow access to your microphone to send voice messages and make calls with support.</string>
```

Use wording suited to your app and its languages, then rebuild the native app. The descriptions do not request any permission: they supply the text of the iOS prompts shown when the user starts using these features. The config plugin does not add them.

**Android notifications: use Firebase Messaging 25.1.2 or newer** (Firebase BoM 34.18.0 or newer). The plugin adds this BoM when your app sets no Firebase version. If your app pins an older BoM or `firebase-messaging` version, prebuild warns: upgrade it.

### 4. Review the behavior changes

On Android:

| API | Change | What to do |
| --- | --- | --- |
| `show()` | Opens the chatbox in a bottom sheet above your app, instead of a full-screen activity. | Nothing. |
| `openChat()` | Throws `ERR_CRISP_UNSUPPORTED`: Crisp Android 3.0.0beta2 cannot open the chat section directly. | Call `show()` on Android. |
| `getSessionIdentifier()` | Resolves to `null` unless the chatbox is shown. | Read the session identifier from the `onSessionLoaded` event. |
| `showMessage()`, `runBotScenario()` | Run once a chatbox is ready: right away if it is shown, otherwise the next time it is. | Nothing. |
| `onMessageSent`, `onMessageReceived` | The `content` of non-text messages is an empty string, as on iOS. | Do not rely on `content` for audio, file or other non-text messages. |
| `setUserCompany()` | Ignores an `employment` without `role`, with a warning. | Set `employment.role` whenever you set `employment`. |
| Notification tap | Opens the conversation in a bottom sheet above your app. | Nothing. |

For every platform difference, see the [API reference](./docs/API.md#platform-differences).

```typescript
import { Platform } from "react-native";
import { openChat, show } from "crisp-sdk-react-native";

// openChat() is not supported by Crisp Android 3.0.0beta2
Platform.OS === "android" ? show() : openChat();
```

On both platforms, keep logging out with `setTokenId(null)` then `resetSession()`: on Android, a user stops receiving notifications only once their session is reset.

### 5. If Xcode rejects the Crisp resource bundles

Crisp iOS 3.x ships the `CrispChatBox` and `CrispChatBoxFFI` pods. The tested Expo 58.0.23 / React Native 0.88.1 installation, with `expo-modules-autolinking` 58.0.17, reconciles their resource targets automatically: it builds and launches with the generated Podfile and Crisp 3.1.1, without the workaround below. Keep the autolinking version compatible with your Expo SDK; do not install an Expo 58 autolinker into an older SDK just for this fix.

If Xcode 27 rejects the `CrispChatBox-CrispChatBox` or `CrispChatBoxFFI-CrispChatBoxFFI` resource bundle because its iOS deployment target is below the supported range, check the generated Pods project. Some React Native versions adjust the library targets in `react_native_post_install` but leave their resource bundles at the native podspec's iOS 14 minimum.

As an explicit workaround, insert the following **after** `react_native_post_install(...)`, inside your **existing** Podfile `post_install do |installer|` block. Do not add a second `post_install` hook:

```ruby
installer.target_installation_results.pod_target_installation_results.each_value do |result|
  next unless %w[CrispChatBox CrispChatBoxFFI].include?(result.target.pod_name)

  result.resource_bundle_targets.each do |bundle|
    bundle.build_configurations.each do |configuration|
      library_configuration = result.native_target.build_configurations.find do |candidate|
        candidate.name == configuration.name
      end
      library_minimum = library_configuration&.build_settings&.fetch('IPHONEOS_DEPLOYMENT_TARGET', nil)
      bundle_minimum = configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
      next if [library_minimum, bundle_minimum].any? { |value| value.nil? || value.empty? }
      next unless Gem::Version.correct?(library_minimum) && Gem::Version.correct?(bundle_minimum)
      next unless Gem::Version.new(bundle_minimum) < Gem::Version.new(library_minimum)

      configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = library_minimum
    end
  end
end
```

Run `pod install` again, then rebuild. This aligns only these Crisp resource bundles with the minimum already selected for their libraries, separately for each build configuration. It keeps higher or symbolic settings, does not change your app's minimum iOS version, and does not modify the Crisp SDK. If symbolic settings still resolve below Xcode's minimum, fix their value in your app's build configuration.

For Expo projects that regenerate `ios/`, keep this adjustment in an app-owned config plugin or reapply it after prebuild: prebuild can overwrite a generated Podfile. The SDK's config plugin does **not** inject this workaround. An installation that needs it is not an out-of-the-box Xcode 27 validation, and it is unrelated to APNs or session API behavior.

---

## Migrating from `react-native-crisp-chat-sdk`

This guide helps you migrate from the legacy [`react-native-crisp-chat-sdk`](https://github.com/walterholohan/react-native-crisp-chat-sdk) to the official [`crisp-sdk-react-native`](https://github.com/crisp-im/crisp-sdk-react-native).

> **Requirements for `crisp-sdk-react-native`:**
>
> - Expo SDK 51+ (or React Native 0.76+ with Expo Modules)
> - **Note:** Version 0.5.0+ requires Expo SDK 58+, see [Upgrading to 0.5](#upgrading-to-05-crisp-web-chatbox-sdks). Version 0.2.0+ requires Expo SDK 54+ (AGP 8.9.1+). If you are on Expo 51/52/53, use `crisp-sdk-react-native@0.1.4`.
> - New Architecture enabled (default in Expo SDK 53)
> - Expo Go is **not** supported — use a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

---

### Step 1: Update Dependencies

Uninstall the old SDK and install the new one:

```bash
# Remove the old SDK
yarn remove react-native-crisp-chat-sdk
# or: npm uninstall react-native-crisp-chat-sdk

# Install the new SDK
npx expo install crisp-sdk-react-native
# or: yarn add crisp-sdk-react-native
```

> **Note:** `expo-build-properties` is no longer required — you can remove it if it was only used for Crisp.

---

### Step 2: Update `app.json` / `app.config.js`

Replace the plugin name and remove `expo-build-properties` if no longer needed:

**Before:**

```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", { "ios": { "deploymentTarget": "15.1" } }],
      [
        "react-native-crisp-chat-sdk",
        {
          "websiteId": "YOUR_WEBSITE_ID",
          "notifications": {
            "enabled": true
          }
        }
      ]
    ]
  }
}
```

**After:**

```json
{
  "expo": {
    "plugins": [
      [
        "crisp-sdk-react-native",
        {
          "websiteId": "YOUR_WEBSITE_ID",
          "notifications": {
            "enabled": true
          }
        }
      ]
    ]
  }
}
```

> **Tip:** If your app uses another push notification system (e.g., `expo-notifications`, Firebase, OneSignal), you can now use `"mode": "coexistence"` in the notifications config. See the [Push Notifications docs](./docs/PUSH_NOTIFICATIONS.md) for details.

---

### Step 3: Update Imports

Replace the package name in your imports:

**Before** (the legacy package, shown as plain JavaScript):

```js
import CrispChat, {
  configure,
  setUserEmail,
  show,
  // ... other imports
} from "react-native-crisp-chat-sdk";
```

**After:**

```typescript
import CrispChat, {
  configure,
  setUserEmail,
  show,
  // ... other imports
} from "crisp-sdk-react-native";
```

All existing imports — including the `CrispChat` default export — work exactly the same.

---

### Step 4: Rebuild Your App

After making all changes, rebuild your native projects:

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

That's it! Your app should work exactly as before.

---

### New Features in `crisp-sdk-react-native`

The new SDK includes features that were not available in the legacy SDK:

#### Event Listeners

Subscribe to chat events with the `useCrispEvents` hook:

```typescript
import { useCrispEvents } from "crisp-sdk-react-native";

useCrispEvents({
  onSessionLoaded: (sessionId) => console.log("Session:", sessionId),
  onChatOpened: () => console.log("Chat opened"),
  onChatClosed: () => console.log("Chat closed"),
  onMessageSent: (message) => console.log("Sent:", message.content),
  onMessageReceived: (message) => console.log("Received:", message.content),
});
```

#### Show Messages

Display messages programmatically as operator in the chatbox:

```typescript
import { showMessage } from "crisp-sdk-react-native";

showMessage({ type: "text", text: "Hello! How can I help?" });
showMessage({
  type: "picker",
  id: "satisfaction",
  text: "How satisfied are you?",
  choices: [
    { value: "happy", label: "Very satisfied" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Not satisfied" },
  ],
});
```

#### Debug Logging

Enable native SDK logging for debugging:

```typescript
import { setLogLevel, CrispLogLevel, useCrispEvents } from "crisp-sdk-react-native";

setLogLevel(CrispLogLevel.DEBUG);

useCrispEvents({
  onLogReceived: (log) => {
    console.log(`[Crisp] [${log.level}] ${log.tag}: ${log.message}`);
  },
});
```

#### Push Notification Coexistence

If your app uses another push notification system alongside Crisp:

```typescript
import { registerPushToken, isCrispPushNotification } from "crisp-sdk-react-native";

declare const devicePushToken: string; // APNs (hex) or FCM token from your notification library
declare const notificationData: Record<string, string>;

// Register a token from your notification system
registerPushToken(devicePushToken);

// Check if a notification is from Crisp
const isCrisp = isCrispPushNotification(notificationData);
```

---

### Troubleshooting

#### Build fails after migration

Run a clean prebuild to regenerate native projects:

```bash
npx expo prebuild --clean
```

#### iOS build fails locally with missing `CrispSDK.session.*` symbols

If your local iOS build fails with errors about missing `CrispSDK.session.*` members (while the same build passes in CI), Xcode's `DerivedData` cache is likely holding a stale copy of the old SDK, which did not expose the `session` namespace.

Clear `DerivedData` and rebuild:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
npx expo prebuild --clean
npx expo run:ios
```

> Thanks to [@Martinocom-Switcho](https://github.com/crisp-im/crisp-sdk-react-native/issues/27) for documenting this.

#### Push notifications stopped working

1. Make sure the plugin name is updated in `app.json` (Step 2)
2. Rebuild with `npx expo prebuild --clean`
3. Verify your Crisp Dashboard push notification settings are still configured

---

### Need Help?

- [API reference](./docs/API.md) — Every function, hook and type, with platform differences
- [Push Notifications Guide](./docs/PUSH_NOTIFICATIONS.md) — Detailed push notification setup
- [Crisp Developer Documentation](https://docs.crisp.chat/) — Official Crisp docs
- [GitHub Issues](https://github.com/crisp-im/crisp-sdk-react-native/issues) — Report bugs or ask questions
