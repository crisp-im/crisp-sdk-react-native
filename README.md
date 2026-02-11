<p align="center">
  <img width="659" alt="crisp-banner" src="https://github.com/user-attachments/assets/ac273b9a-5713-4fb6-ab1e-7214a018731e" />
  <br />
  <h3 align="center">expo-crisp-sdk</h3>
  <p align="center">Expo Module for Crisp Chat - Add live chat to your React Native app</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/expo-crisp-sdk">
    <img src="https://img.shields.io/npm/v/expo-crisp-sdk.svg" alt="npm version" />
  </a>
  <a href="https://github.com/VirtuozTM/expo-crisp-sdk/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/expo-crisp-sdk.svg" alt="license" />
  </a>
  <img src="https://img.shields.io/badge/Expo%20SDK-53%2B-blue" alt="Expo SDK 53+" />
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey" alt="platforms" />
</p>

---

> [!WARNING]
> **Expo SDK 53+ Required**
>
> This SDK is exclusively compatible with Expo SDK version 53 and newer. For projects using older Expo versions, please use the [legacy React Native SDK](https://github.com/walterholohan/react-native-crisp-chat-sdk).

> [!WARNING]
> **Expo Go is Not Supported**
>
> The Crisp SDK uses native modules that are not available in Expo Go. You must use a [development build](https://docs.expo.dev/develop/development-builds/introduction/):
>
> ```bash
> npx expo run:ios
> # or
> npx expo run:android
> ```

---

## Installation

### For Expo Apps

Install the SDK using your preferred package manager:

```bash
# Using bun
bunx expo install expo-crisp-sdk

# Using pnpm
pnpm dlx expo install expo-crisp-sdk

# Using npm
npx expo install expo-crisp-sdk

# Using yarn
yarn dlx expo install expo-crisp-sdk
```

### Version Targeting

The Crisp SDK requires minimum OS versions to function properly. Install `expo-build-properties` and configure your `app.json`:

```bash
npx expo install expo-build-properties
```

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.1"
          },
          "android": {
            "minSdkVersion": 21
          }
        }
      ]
    ]
  }
}
```

> [!NOTE]
> This ensures your project targets iOS 15.1+ and Android SDK 21+, which are required by the native Crisp SDKs.

### For Bare React Native Apps

This guide is for React Native developers who want to integrate Crisp using the Expo SDK in a project that doesn't use Expo as its development framework.

#### Prerequisites

Before starting, ensure you have:

- React Native 0.79+
- iOS deployment target 15.1+
- Android minSdkVersion 21+
- Node.js 18+

#### Step 1: Install Expo Modules

Run the following command in your project root:

```bash
npx install-expo-modules@latest
```

This command automatically configures your iOS and Android projects to support Expo modules.

> [!NOTE]
> For comprehensive installation details or manual installation steps, refer to [Expo's official guide](https://docs.expo.dev/bare/installing-expo-modules/).

#### Step 2: Install Crisp SDK

```bash
# Using npm
npm install expo-crisp-sdk

# Using yarn
yarn add expo-crisp-sdk

# Using pnpm
pnpm add expo-crisp-sdk

# Using bun
bun add expo-crisp-sdk
```

#### Step 3: Platform Configuration

**iOS:**

```bash
cd ios && pod install
```

**Android:**

Ensure your `android/app/build.gradle` has:

```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
    }
}
```

---

## Configuration

### Get Your Website ID

To use the Crisp SDK, you need your Website ID from the Crisp Dashboard.

1. [Sign up for a free account](https://app.crisp.chat/initiate/signup/) on Crisp (or log in)
2. Go to **Settings** > **Website Settings** > **Setup instructions**
3. Copy your Website ID

<p align="center">
  <em><img width="1575" height="870" alt="Configure_ID" src="https://github.com/user-attachments/assets/b4c37b71-a29f-4675-9831-fb0e5823cb70" /></em>

</p>

### Initialize Crisp

Configure the SDK at app startup with your Website ID:

```typescript
import { useEffect } from "react";
import Crisp from "expo-crisp-sdk";

export default function App() {
  useEffect(() => {
    Crisp.configure("YOUR_WEBSITE_ID");
  }, []);

  return (
    // Your app content
  );
}
```

### Push Notifications (Config Plugin)

To enable push notifications, add the config plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-crisp-sdk",
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

#### Plugin Options

| Option                  | Type                              | Default          | Description                                                                    |
| ----------------------- | --------------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `websiteId`             | `string`                          | -                | Your Crisp Website ID. **Required** when notifications are enabled.            |
| `notifications.enabled` | `boolean`                         | `false`          | Enable push notifications for Crisp Chat.                                      |
| `notifications.mode`    | `"sdk-managed" \| "coexistence"` | `"sdk-managed"` | Notification handling mode. See [Coexistence Mode](#coexistence-mode) below.   |

> [!IMPORTANT]
> The `websiteId` is **required** when `notifications.enabled` is `true`. The plugin will throw an error if it's missing.

#### What the Plugin Configures

**iOS:**

- Adds `remote-notification` to UIBackgroundModes
- Adds `aps-environment` entitlement for APNs
- Registers for remote notifications on app launch
- Forwards device token to Crisp SDK

**Android:**

- Adds `CrispNotificationService` to AndroidManifest
- Adds `firebase-messaging` dependency
- Configures Crisp SDK with websiteId

> [!NOTE]
> After enabling notifications, rebuild your app with `npx expo prebuild --clean` followed by `npx expo run:ios` or `npx expo run:android`.

#### Crisp Dashboard Configuration

Push notifications require additional setup in your Crisp Dashboard (APNs for iOS, Firebase for Android).

See the [Push Notifications Setup Guide](./docs/PUSH_NOTIFICATIONS.md) for detailed step-by-step instructions.

#### Coexistence Mode

By default, Crisp handles all push notification routing exclusively (`"sdk-managed"` mode). If your app uses another notification system (like `expo-notifications`, `@react-native-firebase/messaging`, or OneSignal), use `"coexistence"` mode to let both systems work together:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-crisp-sdk",
        {
          "websiteId": "YOUR_WEBSITE_ID",
          "notifications": {
            "enabled": true,
            "mode": "coexistence"
          }
        }
      ]
    ]
  }
}
```

In coexistence mode, the plugin:

- **Android**: Generates a chained `FirebaseMessagingService` that routes Crisp notifications to the Crisp SDK and delegates all others to `expo-notifications` (or Firebase directly)
- **iOS**: Implements a `UNUserNotificationCenterDelegate` that filters Crisp notifications and forwards the rest to the previous delegate (chain of responsibility)

**JS API for coexistence mode:**

```typescript
import Crisp from "expo-crisp-sdk";

// Register a push token obtained from your notification system
Crisp.registerPushToken(expoPushToken);

// Check if a notification payload is from Crisp
const isCrisp = Crisp.isCrispPushNotification(notificationData);

// Control whether Crisp auto-prompts for notification permissions (iOS only)
Crisp.setShouldPromptForNotificationPermission(false);
```

**Listen for Crisp notifications in the foreground (iOS only):**

```typescript
import { useCrispEvents } from "expo-crisp-sdk";

useCrispEvents({
  onPushNotificationReceived: ({ title, body }) => {
    console.log("Crisp notification:", title, body);
    // Update badge count, show toast, log analytics, etc.
  },
});
```

> [!NOTE]
> `onPushNotificationReceived` is currently **iOS only**. On Android, the Crisp SDK does not expose a foreground notification callback — notifications are handled entirely at the native `FirebaseMessagingService` level.

> [!NOTE]
> In coexistence mode, the native routing is automatic — you don't need to write JS filtering code. The JS API methods (`registerPushToken`, `isCrispPushNotification`) are optional utilities for advanced use cases.

---

## Usage Examples

### Open Chat

Display the Crisp chat widget:

```typescript
import Crisp from "expo-crisp-sdk";

function ChatButton() {
  const openChat = () => {
    Crisp.show();
  };

  return <Button title="Chat with us" onPress={openChat} />;
}
```

### User Identification

Set user information to personalize the chat experience:

```typescript
import Crisp from "expo-crisp-sdk";

// After user logs in
function identifyUser(user) {
  // Basic identification
  Crisp.setUserEmail(user.email);
  Crisp.setUserNickname(user.name);
  Crisp.setUserPhone(user.phone); // E.164 format recommended: "+1234567890"
  Crisp.setUserAvatar(user.avatarUrl);

  // Set company information
  Crisp.setUserCompany({
    name: "Acme Corporation",
    url: "https://acme.com",
    companyDescription: "Leading provider of innovative solutions",
    employment: {
      title: "Software Engineer",
      role: "Engineering",
    },
    geolocation: {
      country: "France",
      city: "Paris",
    },
  });

  // Enable session persistence across devices
  Crisp.setTokenId(user.id);
}

// On logout
function onLogout() {
  Crisp.setTokenId(null);
  Crisp.resetSession();
}
```

### Session Data

Store custom data visible to operators in the Crisp dashboard:

```typescript
import Crisp from "expo-crisp-sdk";

// Store different data types
Crisp.setSessionString("plan", "premium");
Crisp.setSessionBool("verified", true);
Crisp.setSessionInt("loginCount", 42);

// Categorize users with segments
Crisp.setSessionSegment("vip");

// Or set multiple segments at once
Crisp.setSessionSegments(["premium", "early-adopter", "beta-tester"]);

// Replace all existing segments
Crisp.setSessionSegments(["enterprise"], true);

// Get the current session identifier
const sessionId = await Crisp.getSessionIdentifier();
console.log("Session ID:", sessionId);
```

### Event Tracking

Track user actions in the chat timeline:

```typescript
import Crisp, { CrispSessionEventColors } from "expo-crisp-sdk";

// Track a single event
Crisp.pushSessionEvent("Purchase completed", CrispSessionEventColors.GREEN);
Crisp.pushSessionEvent("Payment failed", CrispSessionEventColors.RED);

// Track multiple events at once
Crisp.pushSessionEvents([
  { name: "Viewed pricing page", color: CrispSessionEventColors.BLUE },
  { name: "Started free trial", color: CrispSessionEventColors.GREEN },
  { name: "Upgraded to Pro", color: CrispSessionEventColors.PURPLE },
]);
```

### Event Listeners

Subscribe to SDK events using the `useCrispEvents` hook:

```typescript
import { useState } from "react";
import { View, Button } from "react-native";
import Crisp, { useCrispEvents } from "expo-crisp-sdk";

function ChatScreen() {
  const [unreadCount, setUnreadCount] = useState(0);

  useCrispEvents({
    onSessionLoaded: (sessionId) => {
      console.log("Crisp session ready:", sessionId);
    },
    onChatOpened: () => {
      console.log("Chat opened");
      setUnreadCount(0); // Reset unread count
    },
    onChatClosed: () => {
      console.log("Chat closed");
    },
    onMessageSent: (message) => {
      console.log("User sent:", message.content);
    },
    onMessageReceived: (message) => {
      console.log("Received:", message.content);
      if (message.fromOperator) {
        setUnreadCount((count) => count + 1);
      }
    },
  });

  return (
    <View>
      <Button
        title={`Open Chat (${unreadCount})`}
        onPress={() => Crisp.show()}
      />
    </View>
  );
}
```

### Show Messages

Display messages programmatically in the chat:

```typescript
import Crisp from "expo-crisp-sdk";

// Simple text message
Crisp.showMessage({
  type: "text",
  text: "Hello! How can I help you today?",
});

// File attachment
Crisp.showMessage({
  type: "file",
  url: "https://example.com/document.pdf",
  name: "Document.pdf",
  mimeType: "application/pdf",
});

// Animation (GIF)
Crisp.showMessage({
  type: "animation",
  url: "https://example.com/celebration.gif",
  mimeType: "image/gif",
});

// Audio message
Crisp.showMessage({
  type: "audio",
  url: "https://example.com/voice-note.mp3",
  mimeType: "audio/mpeg",
  duration: 15,
});

// Picker for user choice
Crisp.showMessage({
  type: "picker",
  id: "satisfaction",
  text: "How satisfied are you with our service?",
  choices: [
    { value: "happy", label: "Very satisfied" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Not satisfied" },
  ],
});

// Field for user input
Crisp.showMessage({
  type: "field",
  id: "email",
  text: "What's your email address?",
  explain: "We'll send you updates",
  required: true,
});

// Carousel with multiple items
Crisp.showMessage({
  type: "carousel",
  text: "Check out our products",
  targets: [
    {
      title: "Product A",
      description: "Great for beginners",
      imageUrl: "https://example.com/product-a.jpg",
      actionUrl: "https://example.com/products/a",
    },
    {
      title: "Product B",
      description: "For power users",
      imageUrl: "https://example.com/product-b.jpg",
      actionUrl: "https://example.com/products/b",
    },
  ],
});
```

### Helpdesk

Access your knowledge base:

```typescript
import Crisp from "expo-crisp-sdk";

// Open helpdesk search
Crisp.searchHelpdesk();

// Open a specific article
Crisp.openHelpdeskArticle(
  "getting-started", // Article slug
  "en", // Locale
  "Getting Started", // Optional: Display title
  "Onboarding" // Optional: Category name
);
```

### Bot Scenarios

Trigger automated conversation flows:

```typescript
import Crisp from "expo-crisp-sdk";

// Start a bot scenario configured in your Crisp dashboard
Crisp.runBotScenario("welcome-flow");
```

### Debug Logging

Enable native SDK logging to help debug integration issues:

```typescript
import Crisp, { CrispLogLevel, useCrispEvents } from "expo-crisp-sdk";

// Set the minimum log level (default: WARN)
Crisp.setLogLevel(CrispLogLevel.DEBUG);

// Listen to log messages from the native SDK
useCrispEvents({
  onLogReceived: (log) => {
    console.log(`[Crisp] [${log.level}] ${log.tag}: ${log.message}`);
  },
});
```

Available log levels (from most to least verbose):

| Level     | Value | Description                    |
| --------- | ----- | ------------------------------ |
| `VERBOSE` | 0     | Most verbose, all log messages |
| `DEBUG`   | 1     | Debug information              |
| `INFO`    | 2     | Informational messages         |
| `WARN`    | 3     | Warnings (default)             |
| `ERROR`   | 4     | Error messages only            |
| `ASSERT`  | 5     | Critical assertion failures    |

> [!NOTE]
> Set the log level **after** calling `configure()`. Only logs at or above the configured level are emitted to the `onLogReceived` callback.

---

## API Reference

### Configuration Methods

| Method                 | Description                                                                  | Parameters                | Return |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------- | ------ |
| `configure(websiteId)` | Initialize the SDK with your Website ID. Must be called once at app startup. | `websiteId: string`       | `void` |
| `setTokenId(tokenId)`  | Set a token for session persistence across app reinstalls and devices.       | `tokenId: string \| null` | `void` |

### Logger Methods

| Method              | Description                                                                 | Parameters              | Return |
| ------------------- | --------------------------------------------------------------------------- | ----------------------- | ------ |
| `setLogLevel(level)` | Set the minimum log level for native SDK logging. Logs at or above this level are emitted via `onLogReceived`. | `level: CrispLogLevel` | `void` |

### User Information Methods

| Method                            | Description                                                             | Parameters                                  | Return |
| --------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- | ------ |
| `setUserEmail(email, signature?)` | Set the user's email address. Optional HMAC signature for verification. | `email: string, signature?: string \| null` | `void` |
| `setUserNickname(name)`           | Set the user's display name in the chat.                                | `name: string`                              | `void` |
| `setUserPhone(phone)`             | Set the user's phone number. E.164 format recommended.                  | `phone: string`                             | `void` |
| `setUserAvatar(url)`              | Set the user's avatar image URL.                                        | `url: string`                               | `void` |
| `setUserCompany(company)`         | Set the user's company information.                                     | `company: Company`                          | `void` |

### Session Data Methods

| Method                                     | Description                                                                | Parameters                                | Return                    |
| ------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------- | ------------------------- |
| `setSessionString(key, value)`             | Store a custom string value in session data.                               | `key: string, value: string`              | `void`                    |
| `setSessionBool(key, value)`               | Store a custom boolean value in session data.                              | `key: string, value: boolean`             | `void`                    |
| `setSessionInt(key, value)`                | Store a custom integer value in session data.                              | `key: string, value: number`              | `void`                    |
| `setSessionSegment(segment)`               | Set a single segment to categorize the user.                               | `segment: string`                         | `void`                    |
| `setSessionSegments(segments, overwrite?)` | Set multiple segments. If `overwrite` is true, replaces existing segments. | `segments: string[], overwrite?: boolean` | `void`                    |
| `getSessionIdentifier()`                   | Get the current session identifier.                                        | -                                         | `Promise<string \| null>` |

### Event Tracking Methods

| Method                          | Description                                       | Parameters                                     | Return |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------------- | ------ |
| `pushSessionEvent(name, color)` | Track a single event in the user's chat timeline. | `name: string, color: CrispSessionEventColors` | `void` |
| `pushSessionEvents(events)`     | Track multiple events at once.                    | `events: SessionEvent[]`                       | `void` |

### Session Management

| Method           | Description                                               | Parameters | Return |
| ---------------- | --------------------------------------------------------- | ---------- | ------ |
| `resetSession()` | Clear the current session and start a fresh conversation. | -          | `void` |

### UI Methods

| Method                                               | Description                         | Parameters                                                                      | Return |
| ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- | ------ |
| `show()`                                             | Open the Crisp chat widget.         | -                                                                               | `void` |
| `searchHelpdesk()`                                   | Open the helpdesk search interface. | -                                                                               | `void` |
| `openHelpdeskArticle(id, locale, title?, category?)` | Open a specific helpdesk article.   | `id: string, locale: string, title?: string \| null, category?: string \| null` | `void` |
| `runBotScenario(scenarioId)`                         | Trigger an automated bot scenario.  | `scenarioId: string`                                                            | `void` |

### Push Notification Methods (Coexistence Mode)

| Method                                            | Description                                                                    | Parameters                       | Return    |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------- | --------- |
| `registerPushToken(token)`                        | Register a push token (FCM/APNs) with Crisp.                                  | `token: string`                  | `void`    |
| `isCrispPushNotification(data)`                   | Check if a notification payload is from Crisp.                                 | `data: Record<string, string>`   | `boolean` |
| `setShouldPromptForNotificationPermission(enabled)` | Control auto-prompting for notification permissions (iOS only, no-op on Android). | `enabled: boolean`               | `void`    |

### Message Methods

| Method                 | Description                                         | Parameters                | Return |
| ---------------------- | --------------------------------------------------- | ------------------------- | ------ |
| `showMessage(content)` | Display a message as operator in the local chatbox. | `content: MessageContent` | `void` |

### React Hook

| Hook                        | Description                                     | Parameters                       | Return |
| --------------------------- | ----------------------------------------------- | -------------------------------- | ------ |
| `useCrispEvents(callbacks)` | Subscribe to SDK events with automatic cleanup. | `callbacks: CrispEventCallbacks` | `void` |

### Utility Functions

| Function          | Description                            | Parameters | Return   |
| ----------------- | -------------------------------------- | ---------- | -------- |
| `getSDKVersion()` | Get the expo-crisp-sdk version string. | -          | `string` |

---

## TypeScript Types

### Core Interfaces

#### Company

```typescript
interface Company {
  name: string; // Required: Company name
  url?: string; // Company website URL
  companyDescription?: string; // Brief company description
  employment?: Employment; // User's job details
  geolocation?: Geolocation; // Company location
}
```

#### Employment

```typescript
interface Employment {
  title?: string; // Job title (e.g., "Software Engineer")
  role?: string; // Department/role (e.g., "Engineering")
}
```

#### Geolocation

```typescript
interface Geolocation {
  country?: string; // Country name or ISO code
  city?: string; // City name
}
```

#### SessionEvent

```typescript
interface SessionEvent {
  name: string; // Event name
  color: CrispSessionEventColors; // Event color
}
```

### Message Types

#### CrispMessage

```typescript
interface CrispMessage {
  content: string; // Message text
  timestamp: number; // Unix timestamp (ms)
  fromOperator: boolean; // true if from operator
  fingerprint: string; // Unique message ID
  isMe: boolean; // true if sent by current user
  origin: CrispMessageOrigin; // "local" | "network" | "update"
  user?: CrispUser; // Sender information
}
```

#### CrispUser

```typescript
interface CrispUser {
  nickname?: string; // Display name
  userId?: string; // Unique identifier
  avatar?: string; // Avatar URL
}
```

### Message Content Types

The `showMessage` method accepts these content types:

#### TextMessageContent

```typescript
{ type: "text", text: string }
```

#### FileMessageContent

```typescript
{ type: "file", url: string, name: string, mimeType: string }
```

#### AnimationMessageContent

```typescript
{ type: "animation", url: string, mimeType: string }
```

#### AudioMessageContent

```typescript
{ type: "audio", url: string, mimeType: string, duration: number }
```

#### PickerMessageContent

```typescript
{
  type: "picker",
  id: string,
  text: string,
  choices: Array<{ value: string, label: string, selected?: boolean }>
}
```

#### FieldMessageContent

```typescript
{ type: "field", id: string, text: string, explain?: string, required?: boolean }
```

#### CarouselMessageContent

```typescript
{
  type: "carousel",
  text: string,
  targets: Array<{
    title: string,
    description?: string,
    imageUrl?: string,
    actionUrl?: string
  }>
}
```

### Event Callbacks

```typescript
interface CrispEventCallbacks {
  onSessionLoaded?: (sessionId: string) => void;
  onChatOpened?: () => void;
  onChatClosed?: () => void;
  onMessageSent?: (message: CrispMessage) => void;
  onMessageReceived?: (message: CrispMessage) => void;
  onPushNotificationReceived?: (notification: PushNotificationPayload) => void; // iOS only
  onLogReceived?: (log: CrispLogEntry) => void;
}
```

### Event Payload Types

These types are used internally by the event system:

```typescript
// Payload for onSessionLoaded callback
interface SessionLoadedPayload {
  sessionId: string;
}

// Payload for onMessageSent and onMessageReceived callbacks
interface MessagePayload {
  message: CrispMessage;
}

// Empty payload for onChatOpened and onChatClosed callbacks
type EmptyPayload = Record<string, never>;

// Payload for onPushNotificationReceived callback (iOS only)
interface PushNotificationPayload {
  title: string;
  body: string;
}

// Payload for onLogReceived callback
interface LogReceivedPayload {
  log: CrispLogEntry;
}

// Log entry from the native SDK
interface CrispLogEntry {
  level: CrispLogLevel; // The log level
  tag: string; // Log category/source
  message: string; // Log message content
}

// Message origin type
type CrispMessageOrigin = "local" | "network" | "update";
```

### Helper Types

Types used within message content interfaces:

```typescript
// Choice option for picker messages
interface PickerChoice {
  value: string; // Unique identifier
  label: string; // Display text
  selected?: boolean; // Pre-selected state
}

// Target item for carousel messages
interface CarouselTarget {
  title: string; // Item title
  description?: string; // Item description
  imageUrl?: string; // Image URL
  actionUrl?: string; // Action URL when tapped
}
```

### Enums

#### CrispSessionEventColors

| Value        | Color  | Suggested Use                        |
| ------------ | ------ | ------------------------------------ |
| `RED` (0)    | Red    | Errors, failures, critical events    |
| `ORANGE` (1) | Orange | Warnings, attention needed           |
| `YELLOW` (2) | Yellow | Informational highlights             |
| `GREEN` (3)  | Green  | Success, completion, positive events |
| `BLUE` (4)   | Blue   | Informational, neutral events        |
| `PURPLE` (5) | Purple | Special, premium-related events      |
| `PINK` (6)   | Pink   | Social, engagement events            |
| `BROWN` (7)  | Brown  | Historical, archive events           |
| `GREY` (8)   | Grey   | Secondary, low-priority events       |
| `BLACK` (9)  | Black  | System, administrative events        |

#### CrispLogLevel

| Value          | Description                              |
| -------------- | ---------------------------------------- |
| `VERBOSE` (0)  | Most verbose; includes all log messages  |
| `DEBUG` (1)    | Debug information for development        |
| `INFO` (2)     | Informational messages                   |
| `WARN` (3)     | Warnings (default level)                 |
| `ERROR` (4)    | Error messages only                      |
| `ASSERT` (5)   | Critical assertion failures              |

---

## Troubleshooting

### "Expo Go is not supported"

The Crisp SDK requires native modules. Use a development build instead:

```bash
npx expo run:ios
# or
npx expo run:android
```

### Chat not appearing after `show()`

Ensure you've called `configure()` with a valid Website ID before calling `show()`.

### Push notifications not working

1. Verify the config plugin is properly configured in `app.json`
2. Rebuild with `npx expo prebuild --clean`
3. Ensure your Crisp dashboard has push notifications enabled
4. For iOS: Verify APNs certificates are configured in Crisp dashboard
5. For Android: Verify Firebase is properly configured

### Session data not persisting

Use `setTokenId()` with a unique user identifier to enable session persistence across app reinstalls and devices.

---

## Resources

- [Crisp Help Center](https://help.crisp.chat/)
- [Crisp Developer Documentation](https://docs.crisp.chat/)
- [iOS SDK Documentation](https://docs.crisp.chat/guides/chatbox-sdks/ios-sdk/)
- [Android SDK Documentation](https://docs.crisp.chat/guides/chatbox-sdks/android-sdk/)

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/VirtuozTM/expo-crisp-sdk/issues).

## License

MIT - See [LICENSE](./LICENSE) for details.
