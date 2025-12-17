import { version } from "../package.json";

/**
 * Returns the version of the expo-crisp-sdk package.
 *
 * @returns The SDK version string (e.g., "0.1.0")
 * @example
 * const version = getSDKVersion();
 * console.log(version); // "0.1.0"
 */
export function getSDKVersion(): string {
  return version;
}
