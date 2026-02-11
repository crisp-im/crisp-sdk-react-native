import type {
  Company,
  CrispLogLevel,
  CrispSessionEventColors,
  HelpdeskArticleOptions,
  MessageContent,
  SessionEvent,
} from "./ExpoCrispSdk.types";
import ExpoCrispSdkModule from "./ExpoCrispSdkModule";

// Re-export types, hook, and utilities
export * from "./ExpoCrispSdk.types";
export type { CrispEventCallbacks } from "./useCrispEvents";
export { useCrispEvents } from "./useCrispEvents";
export { getSDKVersion } from "./version";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Initialize the Crisp SDK with your website ID.
 * Must be called once at app startup before using any other methods.
 *
 * @param websiteId - Your Website ID from the Crisp Dashboard
 */
export function configure(websiteId: string): void {
  ExpoCrispSdkModule.configure(websiteId);
}

/**
 * Set a token for session persistence across app reinstalls and devices.
 *
 * @param tokenId - Unique identifier (e.g., user ID), or `null` to clear
 */
export function setTokenId(tokenId: string | null): void {
  ExpoCrispSdkModule.setTokenId(tokenId);
}

/**
 * Set the minimum log level for SDK logging.
 *
 * @param level - Minimum log level to emit
 */
export function setLogLevel(level: CrispLogLevel): void {
  ExpoCrispSdkModule.setLogLevel(level);
}

// ============================================================================
// User Information
// ============================================================================

/**
 * Set the user's email address for identification in the chat.
 *
 * @param email - User's email address
 * @param signature - Optional HMAC-SHA256 signature for email verification
 */
export function setUserEmail(email: string, signature?: string | null): void {
  ExpoCrispSdkModule.setUserEmail(email, signature);
}

/**
 * Set the user's display name shown in the chat.
 *
 * @param name - User's nickname or display name
 */
export function setUserNickname(name: string): void {
  ExpoCrispSdkModule.setUserNickname(name);
}

/**
 * Set the user's phone number.
 *
 * @param phone - Phone number (E.164 format recommended)
 */
export function setUserPhone(phone: string): void {
  ExpoCrispSdkModule.setUserPhone(phone);
}

/**
 * Set the user's company information.
 *
 * @param company - Company details including name, URL, employment, and location
 */
export function setUserCompany(company: Company): void {
  ExpoCrispSdkModule.setUserCompany(company);
}

/**
 * Set the user's avatar image.
 *
 * @param url - URL to the user's avatar image
 */
export function setUserAvatar(url: string): void {
  ExpoCrispSdkModule.setUserAvatar(url);
}

// ============================================================================
// Session Data
// ============================================================================

/**
 * Store a custom string value in the session data.
 *
 * @param key - Data key
 * @param value - String value to store
 */
export function setSessionString(key: string, value: string): void {
  ExpoCrispSdkModule.setSessionString(key, value);
}

/**
 * Store a custom boolean value in the session data.
 *
 * @param key - Data key
 * @param value - Boolean value to store
 */
export function setSessionBool(key: string, value: boolean): void {
  ExpoCrispSdkModule.setSessionBool(key, value);
}

/**
 * Store a custom integer value in the session data.
 *
 * @param key - Data key
 * @param value - Integer value to store
 */
export function setSessionInt(key: string, value: number): void {
  ExpoCrispSdkModule.setSessionInt(key, value);
}

/**
 * Set a single segment to categorize the user.
 *
 * @param segment - Segment name (e.g., "premium", "trial")
 */
export function setSessionSegment(segment: string): void {
  ExpoCrispSdkModule.setSessionSegment(segment);
}

/**
 * Set multiple segments to categorize the user.
 *
 * @param segments - Array of segment names
 * @param overwrite - If true, replaces existing segments; if false, appends
 */
export function setSessionSegments(segments: string[], overwrite?: boolean): void {
  ExpoCrispSdkModule.setSessionSegments(segments, overwrite ?? false);
}

/**
 * Get the current session identifier.
 *
 * @returns Promise resolving to the session ID, or `null` if no session is active yet.
 *
 * @remarks
 * Returns `null` in these cases:
 * - Session hasn't loaded yet (wait for `onSessionLoaded` event first)
 * - `configure()` was not called
 * - Native SDK hasn't established a session
 */
export function getSessionIdentifier(): Promise<string | null> {
  return ExpoCrispSdkModule.getSessionIdentifier();
}

// ============================================================================
// Events
// ============================================================================

/**
 * Track a single event in the user's chat timeline.
 *
 * @param name - Event name (e.g., "Purchase completed")
 * @param color - Event color for visual categorization
 */
export function pushSessionEvent(name: string, color: CrispSessionEventColors): void {
  ExpoCrispSdkModule.pushSessionEvent(name, color);
}

/**
 * Track multiple events in the user's chat timeline.
 *
 * @param events - Array of events with name and color
 */
export function pushSessionEvents(events: SessionEvent[]): void {
  ExpoCrispSdkModule.pushSessionEvents(events);
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Reset the current chat session.
 * Clears all session data and starts a fresh conversation.
 */
export function resetSession(): void {
  ExpoCrispSdkModule.resetSession();
}

// ============================================================================
// UI
// ============================================================================

/**
 * Open the Crisp chat widget.
 */
export function show(): void {
  ExpoCrispSdkModule.show();
}

/**
 * Open the helpdesk search interface.
 */
export function searchHelpdesk(): void {
  ExpoCrispSdkModule.searchHelpdesk();
}

/**
 * Open a specific helpdesk article.
 *
 * @param options - Article options including id, locale, and optional title/category
 */
export function openHelpdeskArticle(options: HelpdeskArticleOptions): void {
  ExpoCrispSdkModule.openHelpdeskArticle(
    options.id,
    options.locale,
    options.title,
    options.category,
  );
}

/**
 * Trigger an automated bot scenario.
 *
 * @param scenarioId - The scenario identifier from the Crisp dashboard
 */
export function runBotScenario(scenarioId: string): void {
  ExpoCrispSdkModule.runBotScenario(scenarioId);
}

// ============================================================================
// Push Notifications (Coexistence Mode)
// ============================================================================

/**
 * Register a push token (FCM or APNs) with Crisp.
 *
 * @param token - The push token string
 */
export function registerPushToken(token: string): void {
  ExpoCrispSdkModule.registerPushToken(token);
}

/**
 * Check if a notification payload originates from Crisp.
 *
 * @param data - The notification data payload
 * @returns `true` if the notification is from Crisp
 */
export function isCrispPushNotification(data: Record<string, string>): boolean {
  return ExpoCrispSdkModule.isCrispPushNotification(data);
}

/**
 * Control whether the Crisp SDK should automatically prompt for notification permissions.
 * On Android, this is a no-op.
 *
 * @param enabled - `true` to allow auto-prompting, `false` to disable
 */
export function setShouldPromptForNotificationPermission(enabled: boolean): void {
  ExpoCrispSdkModule.setShouldPromptForNotificationPermission(enabled);
}

// ============================================================================
// Messages
// ============================================================================

/**
 * Display a message as operator in the local chatbox.
 *
 * @param content - The message content to display
 */
export function showMessage(content: MessageContent): void {
  ExpoCrispSdkModule.showMessage(content);
}
