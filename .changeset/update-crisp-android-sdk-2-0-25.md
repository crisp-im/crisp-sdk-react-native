---
"crisp-sdk-react-native": patch
---

Update the Crisp Android SDK to 2.0.25 in the native module and Expo config plugin. This upgrades OkHttp and its logging interceptor to 4.12.1 to mitigate compromised eMudhra certificates and prevents chat crashes caused by resource shrinking in optimized Android builds. No JavaScript API changes are required; rebuild the Android app to include the native fixes.
