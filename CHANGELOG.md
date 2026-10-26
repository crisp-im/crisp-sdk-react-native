# crisp-sdk-react-native

## 0.4.4

### Patch Changes

- dea192e: Fix `show()` on iOS doing nothing when another modal is already on screen. The chatbox was presented on the key window's root view controller, which UIKit refuses while it is already presenting another controller ("Attempt to present … which is already presenting …"). It is now presented on the top-most view controller, like the notification-tap presentation, and `show()` is a no-op when a chatbox is already presented or a transition is in flight.
- 6dcb22f: Present the Crisp chatbox from a single native code path. `show()`, `openChat()`, `searchHelpdesk()`, `openHelpdeskArticle()` and the iOS notification tap now share one iOS presenter that applies the destination and presents `ChatViewController` in one main-thread step, instead of two separate bridge calls from JavaScript. On iOS, opening the chatbox while a modal is already being dismissed now waits for the transition to finish instead of being silently dropped. Android behavior is unchanged.
- 3f3df64: Update the Crisp Android SDK to 2.0.25 in the native module and Expo config plugin. This upgrades OkHttp and its logging interceptor to 4.12.1 to mitigate compromised eMudhra certificates and prevents chat crashes caused by resource shrinking in optimized Android builds. No JavaScript API changes are required; rebuild the Android app to include the native fixes.

## 0.3.1

### Minor Changes

- Upgrade to Expo SDK 56 and bump Crisp Android SDK to 2.0.21

### Patch Changes

- 0e182eb: Add migration guide from `react-native-crisp-chat-sdk` to `crisp-sdk-react-native` with step-by-step instructions, before/after code examples, and API change reference
