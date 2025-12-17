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

// ============================================================================
// Message Content Types (for showMessage)
// ============================================================================

/**
 * Text message content - the simplest message type.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({ type: "text", text: "Hello! How can I help you?" });
 * ```
 */
export interface TextMessageContent {
  type: "text";
  /** The text message to display */
  text: string;
}

/**
 * File attachment content.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({
 *   type: "file",
 *   url: "https://example.com/document.pdf",
 *   name: "Document.pdf",
 *   mimeType: "application/pdf"
 * });
 * ```
 */
export interface FileMessageContent {
  type: "file";
  /** URL to the file */
  url: string;
  /** Display name for the file */
  name: string;
  /** MIME type of the file (e.g., "application/pdf", "image/png") */
  mimeType: string;
}

/**
 * Animation (GIF) content.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({
 *   type: "animation",
 *   url: "https://example.com/animation.gif",
 *   mimeType: "image/gif"
 * });
 * ```
 */
export interface AnimationMessageContent {
  type: "animation";
  /** URL to the animation (typically GIF) */
  url: string;
  /** MIME type (e.g., "image/gif") */
  mimeType: string;
}

/**
 * Audio message content.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({
 *   type: "audio",
 *   url: "https://example.com/audio.mp3",
 *   mimeType: "audio/mpeg",
 *   duration: 30
 * });
 * ```
 */
export interface AudioMessageContent {
  type: "audio";
  /** URL to the audio file */
  url: string;
  /** MIME type (e.g., "audio/mpeg", "audio/wav") */
  mimeType: string;
  /** Duration in seconds */
  duration: number;
}

/**
 * A single choice option for picker content.
 */
export interface PickerChoice {
  /** Unique identifier for this choice */
  value: string;
  /** Display label for the choice */
  label: string;
  /** Whether this choice is pre-selected */
  selected?: boolean;
}

/**
 * Picker content - allows user to select from predefined choices.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({
 *   type: "picker",
 *   id: "satisfaction",
 *   text: "How satisfied are you?",
 *   choices: [
 *     { value: "happy", label: "Happy" },
 *     { value: "neutral", label: "Neutral" },
 *     { value: "sad", label: "Sad" }
 *   ]
 * });
 * ```
 */
export interface PickerMessageContent {
  type: "picker";
  /** Unique identifier for this picker */
  id: string;
  /** Question or prompt text */
  text: string;
  /** Available choices for the user */
  choices: PickerChoice[];
}

/**
 * Field content - prompts user for text input.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({
 *   type: "field",
 *   id: "email",
 *   text: "What's your email?",
 *   explain: "We'll send you updates",
 *   required: true
 * });
 * ```
 */
export interface FieldMessageContent {
  type: "field";
  /** Unique identifier for this field */
  id: string;
  /** Question or label text */
  text: string;
  /** Placeholder or explanatory text */
  explain?: string;
  /** Whether this field is required */
  required?: boolean;
}

/**
 * A single target/item in a carousel.
 */
export interface CarouselTarget {
  /** Title of the carousel item */
  title: string;
  /** Description text */
  description?: string;
  /** URL for the item image */
  imageUrl?: string;
  /** Action URL when item is tapped */
  actionUrl?: string;
}

/**
 * Carousel content - displays a horizontal scrollable list.
 *
 * @example
 * ```typescript
 * Crisp.showMessage({
 *   type: "carousel",
 *   text: "Check out our products",
 *   targets: [
 *     { title: "Product 1", description: "Great product", imageUrl: "..." },
 *     { title: "Product 2", description: "Another great one", imageUrl: "..." }
 *   ]
 * });
 * ```
 */
export interface CarouselMessageContent {
  type: "carousel";
  /** Intro text for the carousel */
  text: string;
  /** Items to display in the carousel */
  targets: CarouselTarget[];
}

/**
 * Union type for all message content types.
 * Use discriminated union pattern with `type` field.
 *
 * @example
 * ```typescript
 * // Simple text message
 * Crisp.showMessage({ type: "text", text: "Hello!" });
 *
 * // File attachment
 * Crisp.showMessage({
 *   type: "file",
 *   url: "https://example.com/doc.pdf",
 *   name: "doc.pdf",
 *   mimeType: "application/pdf"
 * });
 *
 * // Picker for user choice
 * Crisp.showMessage({
 *   type: "picker",
 *   id: "rating",
 *   text: "Rate us",
 *   choices: [{ value: "5", label: "5 stars" }]
 * });
 * ```
 */
export type MessageContent =
  | TextMessageContent
  | FileMessageContent
  | AnimationMessageContent
  | AudioMessageContent
  | PickerMessageContent
  | FieldMessageContent
  | CarouselMessageContent;
