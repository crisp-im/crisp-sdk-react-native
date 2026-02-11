# Migration Guide: `react-native-crisp-chat-sdk` → `expo-crisp-sdk`

This guide helps you migrate from the legacy [`react-native-crisp-chat-sdk`](https://github.com/walterholohan/react-native-crisp-chat-sdk) to the official [`expo-crisp-sdk`](https://github.com/crisp-im/crisp-sdk-react-native).

> **Requirements for `expo-crisp-sdk`:**
>
> - Expo SDK 53+ (or React Native 0.79+ with Expo Modules)
> - New Architecture enabled (default in Expo SDK 53)
> - Expo Go is **not** supported — use a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

---

## Step 1: Update Dependencies

Uninstall the old SDK and install the new one:

```bash
# Remove the old SDK
yarn remove react-native-crisp-chat-sdk
# or: npm uninstall react-native-crisp-chat-sdk

# Install the new SDK
npx expo install expo-crisp-sdk
# or: yarn add expo-crisp-sdk
```

> **Note:** Keep `expo-build-properties` — it's still needed to set the iOS deployment target to 15.1+.

---

## Step 2: Update `app.json` / `app.config.js`

Replace the plugin entry:

**Before:**

```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", { "ios": { "deploymentTarget": "15.1" } }],
      [
        "react-native-crisp-chat-sdk",
        {
          "websiteId": "YOUR_WEBSITE_ID",
          "notifications": {
            "enabled": true
          }
        }
      ]
    ]
  }
}
```

**After:**

```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", { "ios": { "deploymentTarget": "15.1" } }],
      [
        "expo-crisp-sdk",
        {
          "websiteId": "YOUR_WEBSITE_ID",
          "notifications": {
            "enabled": true,
            "mode": "sdk-managed"
          }
        }
      ]
    ]
  }
}
```

**What changed:**

| | Before | After |
|---|---|---|
| Plugin name | `"react-native-crisp-chat-sdk"` | `"expo-crisp-sdk"` |
| Notification mode | _(not available)_ | `"sdk-managed"` or `"coexistence"` |

> **Tip:** If your app uses another push notification system (e.g., `expo-notifications`, Firebase, OneSignal), use `"coexistence"` mode instead. See the [Push Notifications docs](./docs/PUSH_NOTIFICATIONS.md) for details.

---

## Step 3: Update Imports

**Before:**

```typescript
import CrispChat, {
  configure,
  setTokenId,
  setUserEmail,
  setUserNickname,
  setUserPhone,
  setUserAvatar,
  setUserCompany,
  setSessionSegment,
  setSessionSegments,
  setSessionString,
  setSessionBool,
  setSessionInt,
  getSessionIdentifier,
  pushSessionEvent,
  pushSessionEvents,
  resetSession,
  show,
  searchHelpdesk,
  openHelpdeskArticle,
  runBotScenario,
  CrispSessionEventColors,
} from "react-native-crisp-chat-sdk";
```

**After:**

```typescript
import {
  configure,
  setTokenId,
  setUserEmail,
  setUserNickname,
  setUserPhone,
  setUserAvatar,
  setUserCompany,
  setSessionSegment,
  setSessionSegments,
  setSessionString,
  setSessionBool,
  setSessionInt,
  getSessionIdentifier,
  pushSessionEvent,
  pushSessionEvents,
  resetSession,
  show,
  searchHelpdesk,
  openHelpdeskArticle,
  runBotScenario,
  CrispSessionEventColors,
} from "expo-crisp-sdk";
```

**What changed:**

- Package name: `"react-native-crisp-chat-sdk"` → `"expo-crisp-sdk"`
- No more default export: `CrispChat` component is removed (see Step 4)

---

## Step 4: Remove the `<CrispChat />` Component

The old SDK exported a `<CrispChat />` React component that called `show()` on mount. The new SDK removes this component — call `show()` directly instead.

**Before:**

```tsx
import CrispChat, { configure } from "react-native-crisp-chat-sdk";

export default function App() {
  configure("YOUR_WEBSITE_ID");
  return <CrispChat />;
}
```

**After:**

```tsx
import { useEffect } from "react";
import { Button, View } from "react-native";
import { configure, show } from "expo-crisp-sdk";

export default function App() {
  useEffect(() => {
    configure("YOUR_WEBSITE_ID");
  }, []);

  return (
    <View>
      <Button title="Chat with us" onPress={() => show()} />
    </View>
  );
}
```

---

## Step 5: Update Changed Method Signatures

Most methods are **identical** between the two SDKs. Only three methods have changed:

### `openHelpdeskArticle` — Now takes an options object

**Before:**

```typescript
openHelpdeskArticle("article-slug", "en", "Getting Started", "Guides");
```

**After:**

```typescript
openHelpdeskArticle({
  id: "article-slug",
  locale: "en",
  title: "Getting Started",   // optional
  category: "Guides",         // optional
});
```

### `setUserEmail` — Signature parameter is now optional

**Before:**

```typescript
// Without verification — had to pass null explicitly
setUserEmail("user@example.com", null);

// With verification
setUserEmail("user@example.com", "hmac-signature");
```

**After:**

```typescript
// Without verification — just omit the second argument
setUserEmail("user@example.com");

// With verification — same as before
setUserEmail("user@example.com", "hmac-signature");
```

### `searchHelpdesk` — No longer auto-opens the chat

**Before:** `searchHelpdesk()` automatically called `show()` internally.

**After:** `searchHelpdesk()` only opens the helpdesk search. If the chat is not already visible, call `show()` yourself:

```typescript
searchHelpdesk();
show(); // Add this if you need the chat to open
```

---

## Step 6: Rebuild Your App

After making all changes, rebuild your native projects:

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

---

## Step 7: Unchanged Methods (No Action Needed)

These methods work exactly the same in both SDKs — no changes required:

| Method | Signature |
|---|---|
| `configure` | `(websiteId: string) => void` |
| `setTokenId` | `(tokenId: string \| null) => void` |
| `setUserNickname` | `(name: string) => void` |
| `setUserPhone` | `(phone: string) => void` |
| `setUserAvatar` | `(url: string) => void` |
| `setUserCompany` | `(company: Company) => void` |
| `setSessionSegment` | `(segment: string) => void` |
| `setSessionSegments` | `(segments: string[], overwrite?: boolean) => void` |
| `setSessionString` | `(key: string, value: string) => void` |
| `setSessionBool` | `(key: string, value: boolean) => void` |
| `setSessionInt` | `(key: string, value: number) => void` |
| `getSessionIdentifier` | `() => Promise<string \| null>` |
| `pushSessionEvent` | `(name: string, color: CrispSessionEventColors) => void` |
| `pushSessionEvents` | `(events: SessionEvent[]) => void` |
| `resetSession` | `() => void` |
| `show` | `() => void` |
| `runBotScenario` | `(scenarioId: string) => void` |

The `Company`, `Employment`, `Geolocation`, and `CrispSessionEventColors` types are also identical.

---

## New Features in `expo-crisp-sdk`

The new SDK includes features that were not available in the legacy SDK:

### Event Listeners

Subscribe to chat events with the `useCrispEvents` hook:

```typescript
import { useCrispEvents } from "expo-crisp-sdk";

useCrispEvents({
  onSessionLoaded: (sessionId) => console.log("Session:", sessionId),
  onChatOpened: () => console.log("Chat opened"),
  onChatClosed: () => console.log("Chat closed"),
  onMessageSent: (message) => console.log("Sent:", message.content),
  onMessageReceived: (message) => console.log("Received:", message.content),
});
```

### Show Messages

Display messages programmatically as operator in the chatbox:

```typescript
import { showMessage } from "expo-crisp-sdk";

showMessage({ type: "text", text: "Hello! How can I help?" });
showMessage({
  type: "picker",
  id: "satisfaction",
  text: "How satisfied are you?",
  choices: [
    { value: "happy", label: "Very satisfied" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Not satisfied" },
  ],
});
```

### Debug Logging

Enable native SDK logging for debugging:

```typescript
import { setLogLevel, CrispLogLevel, useCrispEvents } from "expo-crisp-sdk";

setLogLevel(CrispLogLevel.DEBUG);

useCrispEvents({
  onLogReceived: (log) => {
    console.log(`[Crisp] [${log.level}] ${log.tag}: ${log.message}`);
  },
});
```

### Push Notification Coexistence

If your app uses another push notification system alongside Crisp:

```typescript
import { registerPushToken, isCrispPushNotification } from "expo-crisp-sdk";

// Register a token from your notification system
registerPushToken(expoPushToken);

// Check if a notification is from Crisp
const isCrisp = isCrispPushNotification(notificationData);
```

---

## Complete Before/After Example

### Before (legacy SDK)

```tsx
import CrispChat, {
  configure,
  setTokenId,
  setUserEmail,
  setUserNickname,
  resetSession,
  CrispSessionEventColors,
  pushSessionEvent,
  searchHelpdesk,
  openHelpdeskArticle,
} from "react-native-crisp-chat-sdk";

export default function App() {
  configure("YOUR_WEBSITE_ID");
  setTokenId("user-123");
  setUserEmail("user@example.com", null);
  setUserNickname("John Doe");
  pushSessionEvent("App opened", CrispSessionEventColors.BLUE);

  const openHelp = () => {
    openHelpdeskArticle("getting-started", "en", "Getting Started", null);
  };

  const onLogout = () => {
    setTokenId(null);
    resetSession();
  };

  return <CrispChat />;
}
```

### After (new SDK)

```tsx
import { useEffect } from "react";
import { Button, View } from "react-native";
import {
  configure,
  setTokenId,
  setUserEmail,
  setUserNickname,
  resetSession,
  show,
  CrispSessionEventColors,
  pushSessionEvent,
  searchHelpdesk,
  openHelpdeskArticle,
  useCrispEvents,
} from "expo-crisp-sdk";

export default function App() {
  useEffect(() => {
    configure("YOUR_WEBSITE_ID");
    setTokenId("user-123");
    setUserEmail("user@example.com");
    setUserNickname("John Doe");
    pushSessionEvent("App opened", CrispSessionEventColors.BLUE);
  }, []);

  useCrispEvents({
    onMessageReceived: (message) => {
      console.log("New message:", message.content);
    },
  });

  const openHelp = () => {
    openHelpdeskArticle({ id: "getting-started", locale: "en", title: "Getting Started" });
  };

  const onLogout = () => {
    setTokenId(null);
    resetSession();
  };

  return (
    <View>
      <Button title="Chat with us" onPress={() => show()} />
      <Button title="Help Center" onPress={openHelp} />
    </View>
  );
}
```

---

## Troubleshooting

### Build fails after migration

Run a clean prebuild to regenerate native projects:

```bash
npx expo prebuild --clean
```

### `CrispChat` is not exported

The `<CrispChat />` component has been removed. Use `show()` to open the chat instead. See [Step 4](#step-4-remove-the-crispchat--component).

### Push notifications stopped working

1. Make sure the plugin name is updated in `app.json` (Step 2)
2. Rebuild with `npx expo prebuild --clean`
3. Verify your Crisp Dashboard push notification settings are still configured

### `openHelpdeskArticle` type error

The method now takes an options object instead of positional arguments. See [Step 5](#step-5-update-changed-method-signatures).

---

## Need Help?

- [expo-crisp-sdk README](./README.md) — Full API reference and usage examples
- [Push Notifications Guide](./docs/PUSH_NOTIFICATIONS.md) — Detailed push notification setup
- [Crisp Developer Documentation](https://docs.crisp.chat/) — Official Crisp docs
- [GitHub Issues](https://github.com/crisp-im/crisp-sdk-react-native/issues) — Report bugs or ask questions
