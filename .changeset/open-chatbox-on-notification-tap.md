---
"crisp-sdk-react-native": minor
---

Open the Crisp chatbox when a user taps a Crisp push notification on iOS. Previously the tap brought the app to the foreground but left the message hidden in the closed chatbox, because the iOS SDK's `handlePushNotification` only performs bookkeeping and the notification-tap delegate never presented the chat. It now presents `ChatViewController` on the top-most view controller (in both notification modes). Android already opens the chatbox on tap via the SDK's own back-stacked `ChatActivity` intent, so no Android change is needed.
