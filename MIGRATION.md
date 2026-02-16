# Migration Guide: `react-native-crisp-chat-sdk` → `crisp-sdk-react-native`

This guide helps you migrate from the legacy [`react-native-crisp-chat-sdk`](https://github.com/walterholohan/react-native-crisp-chat-sdk) to the official [`crisp-sdk-react-native`](https://github.com/crisp-im/crisp-sdk-react-native).

> **Requirements for `crisp-sdk-react-native`:**
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
npx expo install crisp-sdk-react-native
# or: yarn add crisp-sdk-react-native
```

> **Note:** Keep `expo-build-properties` — it's still needed to set the iOS deployment target to 15.1+.

---

## Step 2: Update `app.json` / `app.config.js`

Replace the plugin name:

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
        "crisp-sdk-react-native",
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

> **Tip:** If your app uses another push notification system (e.g., `expo-notifications`, Firebase, OneSignal), you can now use `"mode": "coexistence"` in the notifications config. See the [Push Notifications docs](./docs/PUSH_NOTIFICATIONS.md) for details.

---

## Step 3: Update Imports

Replace the package name in your imports:

**Before:**

```typescript
import CrispChat, {
  configure,
  setUserEmail,
  show,
  // ... other imports
} from "react-native-crisp-chat-sdk";
```

**After:**

```typescript
import CrispChat, {
  configure,
  setUserEmail,
  show,
  // ... other imports
} from "crisp-sdk-react-native";
```

All existing imports — including the `CrispChat` default export — work exactly the same.

---

## Step 4: Rebuild Your App

After making all changes, rebuild your native projects:

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

That's it! Your app should work exactly as before.

---

## New Features in `crisp-sdk-react-native`

The new SDK includes features that were not available in the legacy SDK:

### Event Listeners

Subscribe to chat events with the `useCrispEvents` hook:

```typescript
import { useCrispEvents } from "crisp-sdk-react-native";

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
import { showMessage } from "crisp-sdk-react-native";

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
import { setLogLevel, CrispLogLevel, useCrispEvents } from "crisp-sdk-react-native";

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
import { registerPushToken, isCrispPushNotification } from "crisp-sdk-react-native";

// Register a token from your notification system
registerPushToken(expoPushToken);

// Check if a notification is from Crisp
const isCrisp = isCrispPushNotification(notificationData);
```

---

## Troubleshooting

### Build fails after migration

Run a clean prebuild to regenerate native projects:

```bash
npx expo prebuild --clean
```

### Push notifications stopped working

1. Make sure the plugin name is updated in `app.json` (Step 2)
2. Rebuild with `npx expo prebuild --clean`
3. Verify your Crisp Dashboard push notification settings are still configured

---

## Need Help?

- [crisp-sdk-react-native README](./README.md) — Full API reference and usage examples
- [Push Notifications Guide](./docs/PUSH_NOTIFICATIONS.md) — Detailed push notification setup
- [Crisp Developer Documentation](https://docs.crisp.chat/) — Official Crisp docs
- [GitHub Issues](https://github.com/crisp-im/crisp-sdk-react-native/issues) — Report bugs or ask questions
