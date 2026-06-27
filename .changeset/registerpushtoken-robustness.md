---
"crisp-sdk-react-native": patch
---

Harden iOS `registerPushToken`:

- An empty string now **unregisters** by clearing the device token (`CrispSDK.setDeviceToken(Data())`) instead of early-returning — previously there was no way to unregister a push token through the wrapper (e.g. on notification opt-out).
- The hex APNs token is parsed strictly: it throws on odd-length or non-hex input instead of silently skipping invalid bytes and registering a truncated token with no error surfaced to the caller.
