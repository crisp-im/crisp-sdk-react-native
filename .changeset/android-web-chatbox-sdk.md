---
"crisp-sdk-react-native": minor
---

Migrate Android to Crisp Android SDK 3.0.0beta2, the web chatbox SDK. The chatbox opens in a bottom sheet, and notification taps open their conversation above the app.

Breaking changes on Android:

- Requires `compileSdk` 37 and Android Gradle Plugin 9.1 or newer, required by the native SDK and its AndroidX dependencies (Expo SDK 58 or newer).
- `openChat()` rejects with `ERR_CRISP_UNSUPPORTED`: the native SDK cannot open the chat section directly yet. Call `show()` instead.
- `getSessionIdentifier()` resolves to `null` unless the chatbox is shown.
- The `content` of non-text messages in `onMessageSent` and `onMessageReceived` is an empty string, as on iOS.
- `setUserCompany()` ignores an `employment` without `role`, with a warning.
- The config plugin requires Firebase Messaging 25.1.2 or newer (Firebase BoM 34.18.0, added when the app sets no version) and removes the Crisp Android 2.x dependencies added by previous versions.
