import {
  ConfigPlugin,
  withAppBuildGradle,
  withAndroidManifest,
  withMainApplication,
  AndroidConfig,
} from "expo/config-plugins";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";

export const withAndroidNotifications: ConfigPlugin<string> = (
  config,
  websiteId
) => {
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

  // Add Crisp SDK and firebase-messaging dependencies
  config = withAppBuildGradle(config, (config) => {
    // Add Crisp SDK dependency
    if (!config.modResults.contents.includes("im.crisp:crisp-sdk")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'im.crisp:crisp-sdk:2.0.15'`
      );
    }

    // Add firebase-messaging dependency
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
      config.modResults.contents = addKotlinNotificationSupport(
        contents,
        websiteId
      );
    } else if (language === "java") {
      config.modResults.contents = addJavaNotificationSupport(
        contents,
        websiteId
      );
    }

    return config;
  });

  return config;
};

function addKotlinNotificationSupport(src: string, websiteId: string): string {
  // Add import
  if (!src.includes("import im.crisp.client.external.Crisp")) {
    src = src.replace(
      /^(import android\.app\.Application)/m,
      `$1\nimport im.crisp.client.external.Crisp`
    );
  }

  // Add configure and enableNotifications
  if (!src.includes("Crisp.configure")) {
    const result = mergeContents({
      tag: "expo-crisp-sdk-notifications",
      src,
      newSrc: `    // Crisp: Configure SDK and enable push notifications
    Crisp.configure(applicationContext, "${websiteId}")
    Crisp.enableNotifications(applicationContext, true)`,
      anchor: /super\.onCreate\(\)/,
      offset: 1,
      comment: "//",
    });
    src = result.contents;
  }

  return src;
}

function addJavaNotificationSupport(src: string, websiteId: string): string {
  // Add import
  if (!src.includes("import im.crisp.client.external.Crisp;")) {
    src = src.replace(
      /^(import android\.app\.Application;)/m,
      `$1\nimport im.crisp.client.external.Crisp;`
    );
  }

  // Add configure and enableNotifications
  if (!src.includes("Crisp.configure")) {
    src = src.replace(
      /super\.onCreate\(\);/,
      `super.onCreate();
    // Crisp: Configure SDK and enable push notifications
    Crisp.configure(getApplicationContext(), "${websiteId}");
    Crisp.enableNotifications(getApplicationContext(), true);`
    );
  }

  return src;
}
