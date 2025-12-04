import {
  ConfigPlugin,
  withAppBuildGradle,
  withAndroidManifest,
  withMainApplication,
  AndroidConfig,
} from "expo/config-plugins";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";

export const withAndroidNotifications: ConfigPlugin = (config) => {
  // Add CrispNotificationService to manifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const hasService = mainApplication.service.some(
      (s) =>
        s.$?.["android:name"] ===
        "im.crisp.client.external.notification.CrispNotificationService"
    );

    if (!hasService) {
      mainApplication.service.push({
        $: {
          "android:name":
            "im.crisp.client.external.notification.CrispNotificationService",
          "android:exported": "false",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } },
            ],
          },
        ],
      });
    }

    return config;
  });

  // Add firebase-messaging dependency
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("firebase-messaging")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'com.google.firebase:firebase-messaging'`
      );
    }
    return config;
  });

  // Enable notifications in MainApplication
  config = withMainApplication(config, (config) => {
    const { language, contents } = config.modResults;

    if (language === "kt") {
      config.modResults.contents = addKotlinNotificationSupport(contents);
    } else if (language === "java") {
      config.modResults.contents = addJavaNotificationSupport(contents);
    }

    return config;
  });

  return config;
};

function addKotlinNotificationSupport(src: string): string {
  // Add import
  if (!src.includes("import im.crisp.client.external.Crisp")) {
    src = src.replace(
      /^(import android\.app\.Application)/m,
      `$1\nimport im.crisp.client.external.Crisp`
    );
  }

  // Add enableNotifications
  if (!src.includes("Crisp.enableNotifications")) {
    const result = mergeContents({
      tag: "expo-crisp-sdk-notifications",
      src,
      newSrc: `    // Crisp: Enable push notifications
    Crisp.enableNotifications(applicationContext, true)`,
      anchor: /super\.onCreate\(\)/,
      offset: 1,
      comment: "//",
    });
    src = result.contents;
  }

  return src;
}

function addJavaNotificationSupport(src: string): string {
  // Add import
  if (!src.includes("import im.crisp.client.external.Crisp;")) {
    src = src.replace(
      /^(import android\.app\.Application;)/m,
      `$1\nimport im.crisp.client.external.Crisp;`
    );
  }

  // Add enableNotifications
  if (!src.includes("Crisp.enableNotifications")) {
    src = src.replace(
      /super\.onCreate\(\);/,
      `super.onCreate();
    // Crisp: Enable push notifications
    Crisp.enableNotifications(getApplicationContext(), true);`
    );
  }

  return src;
}
