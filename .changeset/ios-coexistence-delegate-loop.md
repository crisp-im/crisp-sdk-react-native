---
"crisp-sdk-react-native": patch
---

iOS coexistence mode: a notification center delegate installed after Crisp that forwards back to Crisp, such as React Native Firebase Messaging, no longer makes the two delegates call each other until the app crashes. The notifications that are not from Crisp now reach each replaced delegate once, most recent first.
