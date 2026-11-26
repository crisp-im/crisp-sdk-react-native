---
"crisp-sdk-react-native": patch
---

iOS: tapping a Crisp notification while the app is not running now opens the chatbox once the app launches. The notification center delegate was set after launch finished, so iOS dropped the tap.
