import { version } from "../package.json";

/**
 * Returns the version of the crisp-sdk-react-native package.
 *
 * @returns The SDK version string (e.g., "0.1.0")
 * @example
 * const version = getSDKVersion();
 * console.log(version); // "0.1.0"
 */
export function getSDKVersion(): string {
  return version;
}
