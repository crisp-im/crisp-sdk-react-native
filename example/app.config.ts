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
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.expo.crisp.sdk",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    appleTeamId: "FC5S5V6TYF",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
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
