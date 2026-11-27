# API reference

Every public export of `crisp-sdk-react-native`. The native SDKs are Crisp iOS 3.1.1 and Crisp Android 3.0.0beta3.

Functions are synchronous and return `void` unless noted. Platform notes describe where iOS and Android differ. For the changes since 0.4, see the [migration guide](../MIGRATION.md#upgrading-to-10-crisp-web-chatbox-sdks).

- [Setup](#setup): `configure`, `setTokenId`, `setLogLevel`
- [User information](#user-information): `setUserEmail`, `setUserNickname`, `setUserPhone`, `setUserAvatar`, `setUserCompany`
- [Session data](#session-data): `setSessionString`, `setSessionBool`, `setSessionInt`, `setSessionSegment`, `setSessionSegments`, `getSessionIdentifier`
- [Session events](#session-events): `pushSessionEvent`, `pushSessionEvents`
- [Session management](#session-management): `resetSession`
- [Chatbox](#chatbox): `show`, `openChat`, `searchHelpdesk`, `openHelpdeskArticle`, `runBotScenario`, `showMessage`
- [Push notifications](#push-notifications): `registerPushToken`, `isCrispPushNotification`, `setShouldPromptForNotificationPermission`
- [Events](#events): `useCrispEvents`
- [Utilities](#utilities): `getSDKVersion`
- [Legacy component](#legacy-component): default export `CrispChat`
- [Enums](#enums): `CrispSessionEventColors`, `CrispLogLevel`
- [Types](#types)
- [Platform differences](#platform-differences)
- [Error codes](#error-codes)

## Setup

### `configure(websiteId: string): void`

Initializes the SDK with your Website ID. Call it once at app startup, before any other method. Find the Website ID in the [Crisp dashboard](https://app.crisp.chat/) under **Settings** > **Website Settings** > **Setup instructions**.

<p align="center">
  <img width="1797" height="872" alt="Setup and Integrations" src="https://github.com/user-attachments/assets/a68dd11e-84ed-4e9f-a68c-ec63fc58c61a" />
</p>

```tsx
import { useEffect } from "react";
import { Text } from "react-native";
import { configure } from "crisp-sdk-react-native";

export default function App() {
  useEffect(() => {
    configure("YOUR_WEBSITE_ID");
  }, []);

  return <Text>Your app</Text>;
}
```

Android: until a website is configured, the user and session setters, `resetSession()` and the methods that open the chatbox throw `ERR_CRISP_NOT_CONFIGURED`. When the config plugin enables notifications, it configures the website at app launch. A blank Website ID throws. Configuring another website closes the chatbox shown and drops the pending `showMessage()` and `runBotScenario()` calls.

### `setTokenId(tokenId: string | null): void`

Sets a token, such as your user ID, that restores the user's conversation across app reinstalls and devices. Pass `null` to clear it, for example on logout.

Android: changing the token closes the chatbox shown and drops the pending `showMessage()` and `runBotScenario()` calls, so a call made for one user never runs in the session of another.

Android: user and session data apply to the session of the current token. Call `setTokenId()` before the user and session setters, or the data stays with the previous session.

### `setLogLevel(level: CrispLogLevel): void`

Sets the minimum level of the native SDK logs sent to [`onLogReceived`](#events). The default is `CrispLogLevel.WARN`. Set it after calling `configure()`.

```tsx
import { CrispLogLevel, setLogLevel, useCrispEvents } from "crisp-sdk-react-native";

setLogLevel(CrispLogLevel.DEBUG);

export function CrispLogger() {
  useCrispEvents({
    onLogReceived: (log) => {
      console.log(`[Crisp] [${log.level}] ${log.tag}: ${log.message}`);
    },
  });
  return null;
}
```

- iOS: the native SDK has four severities. `VERBOSE` and `DEBUG` map to debug, `ASSERT` maps to error. Logs arrive with levels `DEBUG` to `ERROR`, and `tag` is always `"Crisp"`.
- Android: levels map to the `android.util.Log` priorities, and `tag` comes from the SDK. Once the module is loaded, Crisp logs go to `onLogReceived` instead of Logcat.

## User information

| Function | Description |
| --- | --- |
| `setUserEmail(email: string, signature?: string \| null): void` | Sets the user's email. `signature` is an optional HMAC-SHA256 signature for identity verification. |
| `setUserNickname(name: string): void` | Sets the name shown in the chat. |
| `setUserPhone(phone: string): void` | Sets the phone number. E.164 format recommended, such as `"+1234567890"`. |
| `setUserAvatar(url: string): void` | Sets the avatar image URL. |
| `setUserCompany(company: Company): void` | Sets the user's [company](#company). |

Android: `setUserCompany()` ignores an `employment` without `role`, and logs a warning. Set `employment.role` whenever you set `employment`.

```tsx
import {
  resetSession,
  setTokenId,
  setUserAvatar,
  setUserCompany,
  setUserEmail,
  setUserNickname,
  setUserPhone,
} from "crisp-sdk-react-native";

type User = { id: string; email: string; name: string; phone: string; avatarUrl: string };

export function identifyUser(user: User) {
  setTokenId(user.id);
  setUserEmail(user.email);
  setUserNickname(user.name);
  setUserPhone(user.phone);
  setUserAvatar(user.avatarUrl);
  setUserCompany({
    name: "Acme Corporation",
    url: "https://acme.com",
    companyDescription: "Leading provider of innovative solutions",
    employment: { title: "Software Engineer", role: "Engineering" },
    geolocation: { country: "France", city: "Paris" },
  });
}

export function logout() {
  setTokenId(null);
  resetSession();
}
```

## Session data

Custom data shown to operators in the Crisp dashboard.

| Function | Description |
| --- | --- |
| `setSessionString(key: string, value: string): void` | Stores a string. |
| `setSessionBool(key: string, value: boolean): void` | Stores a boolean. |
| `setSessionInt(key: string, value: number): void` | Stores an integer. A decimal `value` is truncated. |
| `setSessionSegment(segment: string): void` | Sets one segment to categorize the user. |
| `setSessionSegments(segments: string[], overwrite?: boolean): void` | Sets several segments. With `overwrite: true`, replaces the existing ones. Defaults to `false`. |
| `getSessionIdentifier(): Promise<string \| null>` | Resolves to the current session identifier, or `null`. See below. |

```tsx
import {
  getSessionIdentifier,
  setSessionBool,
  setSessionInt,
  setSessionSegment,
  setSessionSegments,
  setSessionString,
} from "crisp-sdk-react-native";

setSessionString("plan", "premium");
setSessionBool("verified", true);
setSessionInt("loginCount", 42);

setSessionSegment("vip");
setSessionSegments(["premium", "early-adopter", "beta-tester"]);
setSessionSegments(["enterprise"], true); // replaces all segments

export async function logSessionId() {
  console.log("Session ID:", await getSessionIdentifier());
}
```

`getSessionIdentifier()` differs by platform:

- iOS: resolves to the identifier once the session has loaded, even after the chatbox is closed, and to `null` before.
- Android: resolves to `null` unless the chatbox is shown, as Crisp Android 3.x reads it from the chatbox. Read the identifier from the [`onSessionLoaded`](#events) event instead.

Android: the user, session data and session event setters are saved, then applied when a chatbox loads the session.

## Session events

Events appear in the user's conversation timeline.

| Function | Description |
| --- | --- |
| `pushSessionEvent(name: string, color: CrispSessionEventColors): void` | Pushes one event. |
| `pushSessionEvents(events: SessionEvent[]): void` | Pushes several [events](#sessionevent). |

An unknown color value falls back to `BLACK`.

```tsx
import { CrispSessionEventColors, pushSessionEvent, pushSessionEvents } from "crisp-sdk-react-native";

pushSessionEvent("Purchase completed", CrispSessionEventColors.GREEN);
pushSessionEvent("Payment failed", CrispSessionEventColors.RED);

pushSessionEvents([
  { name: "Viewed pricing page", color: CrispSessionEventColors.BLUE },
  { name: "Started free trial", color: CrispSessionEventColors.GREEN },
  { name: "Upgraded to Pro", color: CrispSessionEventColors.PURPLE },
]);
```

## Session management

### `resetSession(): void`

Clears the current session and starts a new conversation. To log a user out, call `setTokenId(null)` then `resetSession()`.

Android: right after `setTokenId(null)`, `resetSession()` also resets the session of the user who logged out. A user stops receiving notifications only once their session is reset.

## Chatbox

| Function | Description |
| --- | --- |
| `show(): void` | Opens the chatbox. |
| `openChat(): void` | iOS: opens the chatbox on the Chat tab. Android: throws `ERR_CRISP_UNSUPPORTED`. |
| `searchHelpdesk(): void` | Opens the chatbox on the helpdesk search. |
| `openHelpdeskArticle(options: HelpdeskArticleOptions): void` | Opens the chatbox on a helpdesk [article](#helpdeskarticleoptions). |
| `runBotScenario(scenarioId: string): void` | Starts a bot scenario configured in the Crisp dashboard. |
| `showMessage(content: MessageContent): void` | Shows a [message](#message-content) from an operator in the local chatbox. |

### Opening the chatbox

- iOS: the chatbox opens on the last active tab, over the top-most view controller, including a modal already on screen. `show()` does nothing if a chatbox is already presented. If a modal is being dismissed, the chatbox waits for the transition to end.
- Android: the chatbox opens in a bottom sheet above your app. `show()` throws `ERR_CRISP_NO_ACTIVITY` without a foreground activity, or if the current activity is not a `FragmentActivity`.

`openChat()` is not supported by Crisp Android 3.0.0beta3. Call `show()` on Android:

```tsx
import { Platform } from "react-native";
import { openChat, show } from "crisp-sdk-react-native";

export function openSupport() {
  if (Platform.OS === "android") {
    show();
  } else {
    openChat();
  }
}
```

If you close a modal and open the chatbox in the same handler, such as `router.back()` then `show()`, iOS can present the chatbox on the modal and dismiss it along with it. Open the chatbox once the modal is closed, for example from the previous screen or after the navigation transition.

### Helpdesk

```tsx
import { openHelpdeskArticle, searchHelpdesk } from "crisp-sdk-react-native";

searchHelpdesk();

openHelpdeskArticle({
  id: "getting-started",
  locale: "en",
  title: "Getting Started", // optional
  category: "Onboarding", // optional
});
```

The full signature also accepts a deprecated positional form, kept for compatibility. In that form, pass `locale` too:

```tsx
import { openHelpdeskArticle } from "crisp-sdk-react-native";

// openHelpdeskArticle(
//   optionsOrId: HelpdeskArticleOptions | string,
//   locale?: string,
//   title?: string | null,
//   category?: string | null,
// ): void

openHelpdeskArticle("getting-started", "en", "Getting Started", "Onboarding"); // deprecated
```

### Bot scenarios and messages

```tsx
import { runBotScenario, showMessage } from "crisp-sdk-react-native";

runBotScenario("welcome-flow");

showMessage({ type: "text", text: "Hello! How can I help you today?" });

showMessage({
  type: "file",
  url: "https://example.com/document.pdf",
  name: "Document.pdf",
  mimeType: "application/pdf",
});

showMessage({ type: "animation", url: "https://example.com/celebration.gif", mimeType: "image/gif" });

showMessage({
  type: "audio",
  url: "https://example.com/voice-note.mp3",
  mimeType: "audio/mpeg",
  duration: 15,
});

showMessage({
  type: "picker",
  id: "satisfaction",
  text: "How satisfied are you with our service?",
  choices: [
    { value: "happy", label: "Very satisfied" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Not satisfied" },
  ],
});

showMessage({
  type: "field",
  id: "email",
  text: "What's your email address?",
  explain: "We'll send you updates",
  required: true,
});

showMessage({
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

- Both platforms: `showMessage()` throws for an unknown `type` or a missing required field.
- Android: `showMessage()` and `runBotScenario()` run once a chatbox is ready: right away if it is shown, otherwise the next time it is. A change of website or token drops them. The `required` field of a `field` message has no equivalent and is ignored. An invalid URL throws.

## Push notifications

Helpers for the `coexistence` notification mode. The native routing is automatic: these functions are optional. See the [push notifications guide](./PUSH_NOTIFICATIONS.md#coexistence-mode).

| Function | Description |
| --- | --- |
| `registerPushToken(token: string): void` | Registers a push token with Crisp. |
| `isCrispPushNotification(data: Record<string, string>): boolean` | Returns `true` if a notification payload comes from Crisp. |
| `setShouldPromptForNotificationPermission(enabled: boolean): void` | iOS: controls whether Crisp prompts for the notification permission. Android: no-op, the chatbox asks for the permission itself. |

`registerPushToken()` takes the native device token:

- iOS: the APNs token as a hex string. An empty string clears the token. A token of odd length or with invalid hex characters throws.
- Android: the FCM token. An empty string is ignored.

```tsx
import { isCrispPushNotification, registerPushToken } from "crisp-sdk-react-native";

declare const devicePushToken: string; // from your notification library
declare const notificationData: Record<string, string>;

registerPushToken(devicePushToken);

if (isCrispPushNotification(notificationData)) {
  console.log("Crisp notification");
}
```

## Events

### `useCrispEvents(callbacks?: CrispEventCallbacks): void`

React hook that subscribes to SDK events on mount and unsubscribes on unmount. Every callback is optional. The hook always calls the latest callbacks passed, without resubscribing.

| Callback | Called when |
| --- | --- |
| `onSessionLoaded?: (sessionId: string) => void` | The session has loaded. |
| `onChatOpened?: () => void` | The chatbox opens. |
| `onChatClosed?: () => void` | The chatbox closes. |
| `onMessageSent?: (message: CrispMessage) => void` | The user sends a message. |
| `onMessageReceived?: (message: CrispMessage) => void` | A message is received. Check `message.fromOperator`. |
| `onPushNotificationReceived?: (notification: PushNotificationPayload) => void` | A Crisp push notification arrives. Requires notifications enabled in the config plugin. |
| `onLogReceived?: (log: CrispLogEntry) => void` | The native SDK logs at or above the level set with `setLogLevel()`. |

- Both platforms: the `content` of non-text messages, such as audio or files, is an empty string.
- Android: chatbox events come from the chatbox opened by `show()`, so `onSessionLoaded` fires once that chatbox has loaded the session.
- `onPushNotificationReceived`, iOS: fires when a Crisp notification is presented while the app is in the foreground, in both notification modes.
- `onPushNotificationReceived`, Android: fires when a Crisp notification is shown, in both notification modes, while the JavaScript module is loaded.

```tsx
import { useState } from "react";
import { Button, View } from "react-native";
import { show, useCrispEvents } from "crisp-sdk-react-native";

export function ChatScreen() {
  const [unreadCount, setUnreadCount] = useState(0);

  useCrispEvents({
    onSessionLoaded: (sessionId) => console.log("Crisp session ready:", sessionId),
    onChatOpened: () => setUnreadCount(0),
    onChatClosed: () => console.log("Chat closed"),
    onMessageSent: (message) => console.log("User sent:", message.content),
    onMessageReceived: (message) => {
      if (message.fromOperator) setUnreadCount((count) => count + 1);
    },
    onPushNotificationReceived: ({ title, body }) => console.log("Crisp notification:", title, body),
  });

  return (
    <View>
      <Button title={`Open chat (${unreadCount})`} onPress={() => show()} />
    </View>
  );
}
```

## Utilities

### `getSDKVersion(): string`

Returns the version of the `crisp-sdk-react-native` package, as declared in its `package.json`.

## Legacy component

### `CrispChat` (default export)

Deprecated: call `show()` instead. This component will be removed in a future version. It renders an empty `View` and calls `show()` on mount.

```tsx
import CrispChat, { show } from "crisp-sdk-react-native";

// Before (deprecated)
export const LegacySupport = () => <CrispChat />;

// After
export const openSupport = () => show();
```

## Enums

### `CrispSessionEventColors`

| Member | Value | Suggested use |
| --- | --- | --- |
| `RED` | 0 | Errors, failures, critical events |
| `ORANGE` | 1 | Warnings, attention needed |
| `YELLOW` | 2 | Informational highlights |
| `GREEN` | 3 | Success, completion, positive events |
| `BLUE` | 4 | Informational, neutral events |
| `PURPLE` | 5 | Special, premium-related events |
| `PINK` | 6 | Social, engagement events |
| `BROWN` | 7 | Historical, archive events |
| `GREY` | 8 | Secondary, low-priority events |
| `BLACK` | 9 | System, administrative events |

### `CrispLogLevel`

From most to least verbose:

| Member | Value | Description |
| --- | --- | --- |
| `VERBOSE` | 0 | All log messages |
| `DEBUG` | 1 | Debug information |
| `INFO` | 2 | Informational messages |
| `WARN` | 3 | Warnings (default) |
| `ERROR` | 4 | Errors only |
| `ASSERT` | 5 | Critical assertion failures |

## Types

All types are exported from `crisp-sdk-react-native`.

### Company

```tsx
interface Company {
  name: string; // required
  url?: string;
  companyDescription?: string;
  employment?: Employment;
  geolocation?: Geolocation;
}

interface Employment {
  title?: string; // job title, such as "Software Engineer"
  role?: string; // department, such as "Engineering". Required by Android when employment is set
}

interface Geolocation {
  country?: string; // country name or ISO code
  city?: string;
}
```

### SessionEvent

```tsx
import type { CrispSessionEventColors } from "crisp-sdk-react-native";

interface SessionEvent {
  name: string;
  color: CrispSessionEventColors;
}
```

### HelpdeskArticleOptions

```tsx
interface HelpdeskArticleOptions {
  id: string; // article slug
  locale: string; // such as "en"
  title?: string | null;
  category?: string | null;
}
```

### Messages and logs

```tsx
import type { CrispLogLevel } from "crisp-sdk-react-native";

interface CrispMessage {
  content: string; // text of the message, "" for non-text messages
  timestamp: number; // Unix timestamp in milliseconds
  fromOperator: boolean;
  fingerprint: string; // unique message identifier
  isMe: boolean; // sent by the current user
  origin: CrispMessageOrigin;
  user?: CrispUser; // sender
}

type CrispMessageOrigin = "local" | "network" | "update";

interface CrispUser {
  nickname?: string;
  userId?: string;
  avatar?: string; // URL
}

interface PushNotificationPayload {
  title: string;
  body: string;
}

interface CrispLogEntry {
  level: CrispLogLevel;
  tag: string; // log category, always "Crisp" on iOS
  message: string;
}
```

### CrispEventCallbacks

```tsx
import type { CrispLogEntry, CrispMessage, PushNotificationPayload } from "crisp-sdk-react-native";

interface CrispEventCallbacks {
  onSessionLoaded?: (sessionId: string) => void;
  onChatOpened?: () => void;
  onChatClosed?: () => void;
  onMessageSent?: (message: CrispMessage) => void;
  onMessageReceived?: (message: CrispMessage) => void;
  onLogReceived?: (log: CrispLogEntry) => void;
  onPushNotificationReceived?: (notification: PushNotificationPayload) => void;
}
```

The native event payloads are also exported. `useCrispEvents` unwraps them for you:

```tsx
import type { CrispLogEntry, CrispMessage } from "crisp-sdk-react-native";

interface SessionLoadedPayload {
  sessionId: string; // onSessionLoaded
}

interface MessagePayload {
  message: CrispMessage; // onMessageSent, onMessageReceived
}

interface LogReceivedPayload {
  log: CrispLogEntry; // onLogReceived
}

type EmptyPayload = Record<string, never>; // onChatOpened, onChatClosed
```

### Message content

`MessageContent`, accepted by `showMessage()`, is a union discriminated by `type`:

```tsx
type MessageContent =
  | TextMessageContent
  | FileMessageContent
  | AnimationMessageContent
  | AudioMessageContent
  | PickerMessageContent
  | FieldMessageContent
  | CarouselMessageContent;

interface TextMessageContent {
  type: "text";
  text: string;
}

interface FileMessageContent {
  type: "file";
  url: string;
  name: string;
  mimeType: string;
}

interface AnimationMessageContent {
  type: "animation";
  url: string;
  mimeType: string;
}

interface AudioMessageContent {
  type: "audio";
  url: string;
  mimeType: string;
  duration: number; // seconds
}

interface PickerMessageContent {
  type: "picker";
  id: string;
  text: string;
  choices: PickerChoice[];
}

interface PickerChoice {
  value: string;
  label: string;
  selected?: boolean;
}

interface FieldMessageContent {
  type: "field";
  id: string;
  text: string;
  explain?: string;
  required?: boolean; // ignored on Android
}

interface CarouselMessageContent {
  type: "carousel";
  text: string;
  targets: CarouselTarget[];
}

interface CarouselTarget {
  title: string;
  description?: string;
  imageUrl?: string;
  actionUrl?: string; // opened when the item is tapped
}
```

## Platform differences

| API | iOS | Android |
| --- | --- | --- |
| `show()` | Presented over the top-most view controller, on the last active tab. | Bottom sheet above your app. Throws `ERR_CRISP_NO_ACTIVITY` without a foreground `FragmentActivity`. |
| `openChat()` | Opens the Chat tab. | Throws `ERR_CRISP_UNSUPPORTED`. Call `show()`. |
| `getSessionIdentifier()` | The identifier once the session has loaded, `null` before. | `null` unless the chatbox is shown. Use `onSessionLoaded`. |
| `showMessage()`, `runBotScenario()` | Run right away. | Run once a chatbox is ready: right away if shown, otherwise the next time it is. |
| `setUserCompany()` | Accepts any `employment`. | Ignores an `employment` without `role`, with a warning. |
| `registerPushToken()` | APNs token as hex. Throws on invalid hex. | FCM token. |
| `setShouldPromptForNotificationPermission()` | Supported. | No-op. |
| `onPushNotificationReceived` | Notification presented in the foreground. | Notification shown, while the module is loaded. |
| `onLogReceived` | `tag` is always `"Crisp"`. | `tag` comes from the SDK. Logs no longer reach Logcat. |
| Notification tap | Opens the chatbox. | Opens the conversation in a bottom sheet above your app. |
| `onMessageSent`, `onMessageReceived` | `content` is `""` for non-text messages. | Same. |

## Error codes

Android throws these coded errors. Catch them with `try`/`catch` and read `error.code`.

| Code | Thrown by | Cause |
| --- | --- | --- |
| `ERR_CRISP_NOT_CONFIGURED` | User, session data and session event setters, `resetSession()`, and the methods that open the chatbox | No website configured: call `configure()` first. |
| `ERR_CRISP_UNSUPPORTED` | `openChat()` | Not supported by Crisp Android 3.0.0beta3. |
| `ERR_CRISP_NO_ACTIVITY` | `show()`, `searchHelpdesk()`, `openHelpdeskArticle()` | No foreground activity, or the current activity is not a `FragmentActivity`. |
