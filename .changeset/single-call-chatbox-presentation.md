---
"crisp-sdk-react-native": patch
---

Present the Crisp chatbox from a single native code path. `show()`, `openChat()`, `searchHelpdesk()`, `openHelpdeskArticle()` and the iOS notification tap now share one iOS presenter that applies the destination and presents `ChatViewController` in one main-thread step, instead of two separate bridge calls from JavaScript. On iOS, opening the chatbox while a modal is already being dismissed now waits for the transition to finish instead of being silently dropped. Android behavior is unchanged.
