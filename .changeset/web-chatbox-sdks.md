---
"crisp-sdk-react-native": minor
---

Migrate to Crisp iOS SDK 3.1.1 and Crisp Android SDK 3.0.0beta3, the web chatbox SDKs. On Android, the chatbox opens in a bottom sheet, and notification taps open their conversation above the app. See the [migration guide](./MIGRATION.md#upgrading-to-05-crisp-web-chatbox-sdks).

Expo SDK 54 or newer (React Native 0.81 or newer) is still supported: Crisp Android 3.0.0beta3 requires `compileSdk` 36 and Android Gradle Plugin 8.9.1 or newer. On iOS, the config plugin adds a Podfile step that aligns the Crisp resource bundles with the iOS minimum of their library, which Xcode 27 requires.

Breaking changes:

- iOS: the app must declare `NSCameraUsageDescription` and `NSMicrophoneUsageDescription`, otherwise Crisp iOS 3.x displays a configuration screen instead of the chat.
- Android: `openChat()` throws `ERR_CRISP_UNSUPPORTED`, as the native SDK cannot open the chat section directly yet. Call `show()` instead.
- Android: `getSessionIdentifier()` resolves to `null` unless the chatbox is shown.
- Android: the `content` of non-text messages in `onMessageSent` and `onMessageReceived` is an empty string, as on iOS.
- Android: `setUserCompany()` ignores an `employment` without `role`, with a warning.
- Android: the config plugin requires Firebase Messaging 25.1.2 or newer (Firebase BoM 34.18.0, added when the app sets no version) and removes the Crisp Android 2.x dependencies added by previous versions.
