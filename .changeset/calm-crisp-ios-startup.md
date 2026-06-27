---
"crisp-sdk-react-native": patch
---

Fix an iOS release startup deadlock by scheduling the initial Crisp SDK configuration and callback registration on the main queue.
