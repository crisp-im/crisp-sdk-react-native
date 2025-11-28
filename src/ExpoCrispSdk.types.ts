/**
 * Crisp SDK Types
 */

/**
 * Colors available for session events
 */
export enum CrispSessionEventColors {
  RED = 0,
  ORANGE = 1,
  YELLOW = 2,
  GREEN = 3,
  BLUE = 4,
  PURPLE = 5,
  PINK = 6,
  BROWN = 7,
  GREY = 8,
  BLACK = 9,
}

/**
 * Employment information for a user
 */
export interface Employment {
  /** Job title (e.g., "Software Engineer") */
  title?: string;
  /** Job role (e.g., "Engineering") */
  role?: string;
}

/**
 * Geolocation information
 */
export interface Geolocation {
  /** Country name or code */
  country?: string;
  /** City name */
  city?: string;
}

/**
 * Company information for a user
 */
export interface Company {
  /** Company name (required) */
  name: string;
  /** Company website URL */
  url?: string;
  /** Company description */
  companyDescription?: string;
  /** User's employment details within the company */
  employment?: Employment;
  /** Company location */
  geolocation?: Geolocation;
}

/**
 * Session event with name and color
 */
export interface SessionEvent {
  /** Event name */
  name: string;
  /** Event color for display */
  color: CrispSessionEventColors;
}
