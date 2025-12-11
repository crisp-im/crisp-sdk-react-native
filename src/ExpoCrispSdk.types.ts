/**
 * Crisp SDK Types
 *
 * Type definitions for the Expo Crisp SDK.
 * These types are used to configure user information, company data,
 * and session events in the Crisp chat widget.
 *
 * @packageDocumentation
 */

/**
 * Colors available for session events.
 * Used to visually categorize events in the Crisp dashboard timeline.
 *
 * @example
 * ```typescript
 * import { CrispSessionEventColors } from "expo-crisp-sdk";
 *
 * // Use GREEN for successful actions
 * ExpoCrispSdk.pushSessionEvent("Purchase completed", CrispSessionEventColors.GREEN);
 *
 * // Use RED for errors or issues
 * ExpoCrispSdk.pushSessionEvent("Payment failed", CrispSessionEventColors.RED);
 * ```
 */
export enum CrispSessionEventColors {
  /** Red - Use for errors, failures, or critical events */
  RED = 0,
  /** Orange - Use for warnings or attention-needed events */
  ORANGE = 1,
  /** Yellow - Use for informational highlights */
  YELLOW = 2,
  /** Green - Use for success, completion, or positive events */
  GREEN = 3,
  /** Blue - Use for informational or neutral events */
  BLUE = 4,
  /** Purple - Use for special or premium-related events */
  PURPLE = 5,
  /** Pink - Use for social or engagement events */
  PINK = 6,
  /** Brown - Use for historical or archive events */
  BROWN = 7,
  /** Grey - Use for secondary or low-priority events */
  GREY = 8,
  /** Black - Use for system or administrative events */
  BLACK = 9,
}

/**
 * Employment information for a user within their company.
 *
 * @example
 * ```typescript
 * const employment: Employment = {
 *   title: "Senior Software Engineer",
 *   role: "Engineering"
 * };
 * ```
 */
export interface Employment {
  /**
   * Job title of the user.
   * @example "Software Engineer", "Product Manager", "CEO"
   */
  title?: string;

  /**
   * Job role or department.
   * @example "Engineering", "Sales", "Marketing", "Support"
   */
  role?: string;
}

/**
 * Geolocation information for a company or user.
 *
 * @example
 * ```typescript
 * const location: Geolocation = {
 *   country: "France",
 *   city: "Paris"
 * };
 * ```
 */
export interface Geolocation {
  /**
   * Country name or ISO country code.
   * @example "France", "United States", "FR", "US"
   */
  country?: string;

  /**
   * City name.
   * @example "Paris", "New York", "London"
   */
  city?: string;
}

/**
 * Company information for a user.
 * Associates the user with their organization in the Crisp dashboard.
 *
 * @example
 * ```typescript
 * import ExpoCrispSdk from "expo-crisp-sdk";
 *
 * ExpoCrispSdk.setUserCompany({
 *   name: "Acme Corporation",
 *   url: "https://acme.com",
 *   companyDescription: "Leading provider of innovative solutions",
 *   employment: {
 *     title: "Software Engineer",
 *     role: "Engineering"
 *   },
 *   geolocation: {
 *     country: "France",
 *     city: "Paris"
 *   }
 * });
 * ```
 */
export interface Company {
  /**
   * Company name (required).
   * This is the only required field for company information.
   */
  name: string;

  /**
   * Company website URL.
   * Should be a valid URL including the protocol (https://).
   * @example "https://acme.com"
   */
  url?: string;

  /**
   * Brief description of the company.
   * Helps operators understand the user's organization context.
   */
  companyDescription?: string;

  /**
   * User's employment details within the company.
   * Includes job title and role/department.
   */
  employment?: Employment;

  /**
   * Company's geographic location.
   * Includes country and city information.
   */
  geolocation?: Geolocation;
}

/**
 * Session event to track in the user's chat timeline.
 * Events are visible to operators and help understand user actions.
 *
 * @example
 * ```typescript
 * import ExpoCrispSdk, { CrispSessionEventColors, SessionEvent } from "expo-crisp-sdk";
 *
 * const events: SessionEvent[] = [
 *   { name: "Viewed pricing page", color: CrispSessionEventColors.BLUE },
 *   { name: "Started free trial", color: CrispSessionEventColors.GREEN },
 *   { name: "Upgraded to Pro", color: CrispSessionEventColors.PURPLE }
 * ];
 *
 * ExpoCrispSdk.pushSessionEvents(events);
 * ```
 */
export interface SessionEvent {
  /**
   * Event name describing the action.
   * Keep it concise but descriptive.
   * @example "Purchase completed", "Feature activated", "Error encountered"
   */
  name: string;

  /**
   * Event color for visual categorization in the dashboard.
   * Choose a color that reflects the nature of the event.
   */
  color: CrispSessionEventColors;
}

// ============================================================================
// Event Callback Types
// ============================================================================

/**
 * User information for a message sender.
 * Contains details about who sent the message (operator or visitor).
 *
 * @example
 * ```typescript
 * useCrispEvents({
 *   onMessageReceived: (message) => {
 *     if (message.user) {
 *       console.log("From:", message.user.nickname);
 *       console.log("Avatar:", message.user.avatar);
 *     }
 *   }
 * });
 * ```
 */
export interface CrispUser {
  /**
   * Display name of the user.
   * For operators, this is their configured name in Crisp.
   */
  nickname?: string;

  /**
   * Unique user identifier.
   */
  userId?: string;

  /**
   * URL to the user's avatar image.
   */
  avatar?: string;
}

/**
 * Represents a message in the Crisp chat.
 * Used in message-related event callbacks (onMessageSent, onMessageReceived).
 *
 * @example
 * ```typescript
 * import { useCrispEvents } from "expo-crisp-sdk";
 *
 * useCrispEvents({
 *   onMessageReceived: (message) => {
 *     console.log("New message:", message.content);
 *     console.log("From operator:", message.fromOperator);
 *     console.log("Message ID:", message.fingerprint);
 *     if (message.user) {
 *       console.log("Sender:", message.user.nickname);
 *     }
 *   }
 * });
 * ```
 */
/**
 * Origin of a message - indicates where the message came from.
 */
export type CrispMessageOrigin = "local" | "network" | "update";

export interface CrispMessage {
  /**
   * The message content/text.
   * For non-text messages (audio, file, etc.), this may be empty.
   */
  content: string;

  /**
   * Unix timestamp (in milliseconds) when the message was created.
   */
  timestamp: number;

  /**
   * Whether the message is from an operator (true) or visitor (false).
   */
  fromOperator: boolean;

  /**
   * Unique message identifier.
   * Useful as a React key for rendering message lists.
   */
  fingerprint: string;

  /**
   * Whether the message was sent by the current user (visitor).
   * Shortcut to check if fromOperator is false.
   */
  isMe: boolean;

  /**
   * Origin of the message.
   * - "local": Message created locally (not yet sent to server)
   * - "network": Message received from network/server
   * - "update": Message was updated (edited)
   */
  origin: CrispMessageOrigin;

  /**
   * Information about the message sender.
   * Contains nickname, userId, and avatar URL when available.
   */
  user?: CrispUser;
}

/**
 * Event payload for the onSessionLoaded callback.
 * Emitted when the Crisp session has fully loaded.
 */
export interface SessionLoadedPayload {
  /**
   * The unique session identifier.
   */
  sessionId: string;
}

/**
 * Event payload for message events (onMessageSent, onMessageReceived).
 */
export interface MessagePayload {
  /**
   * The message details.
   */
  message: CrispMessage;
}

/**
 * Empty payload type for events without data (onChatOpened, onChatClosed).
 */
export type EmptyPayload = Record<string, never>;
