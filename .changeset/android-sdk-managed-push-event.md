---
"crisp-sdk-react-native": minor
---

Emit `onPushNotificationReceived` on Android in sdk-managed notification mode.

The Android bridge now forwards Crisp Android SDK notification callbacks to the existing React Native event payload `{ title, body }`, matching the iOS implementation and the Android coexistence mode API. Coexistence mode now relies on the native SDK callback after `CrispNotificationClient.handleNotification(...)`, preventing duplicate JS events.
