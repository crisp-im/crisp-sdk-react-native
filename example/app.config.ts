import type { ExpoConfig } from "expo/config";

const crispWebsiteId = process.env.EXPO_PUBLIC_CRISP_WEBSITE_ID;

if (!crispWebsiteId) {
  throw new Error(
    "EXPO_PUBLIC_CRISP_WEBSITE_ID is required. Copy .env.example to .env and set your Website ID.",
  );
}

const config: ExpoConfig = {
  name: "Expo Crisp SDK Example",
  slug: "expo-crisp-sdk-example",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "expo-crisp-sdk-example",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.expo.crisp.sdk",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // Required by Crisp iOS 3.x, even for text-only conversations
      NSCameraUsageDescription:
        "Allow access to your camera to share photos and make video calls with support.",
      NSMicrophoneUsageDescription:
        "Allow access to your microphone to send voice messages and make calls with support.",
    },
    appleTeamId: "FC5S5V6TYF",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
    },
    googleServicesFile: "./google-services.json",
    package: "com.expo.crisp.sdk",
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        defaultChannel: "default",
      },
    ],
    [
      "../app.plugin.js",
      {
        websiteId: crispWebsiteId,
        notifications: {
          enabled: true,
          mode: "coexistence",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "b4b2b778-1d00-4f5d-a873-68dc2f36b6fe",
    },
  },
};

export default { expo: config };
