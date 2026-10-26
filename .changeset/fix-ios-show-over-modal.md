---
"crisp-sdk-react-native": patch
---

Fix `show()` on iOS doing nothing when another modal is already on screen. The chatbox was presented on the key window's root view controller, which UIKit refuses while it is already presenting another controller ("Attempt to present … which is already presenting …"). It is now presented on the top-most view controller, like the notification-tap presentation, and `show()` is a no-op when a chatbox is already presented or a transition is in flight.
