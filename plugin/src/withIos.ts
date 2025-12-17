import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import {
  type ConfigPlugin,
  withAppDelegate,
  withEntitlementsPlist,
  withInfoPlist,
} from "expo/config-plugins";

export const withIosNotifications: ConfigPlugin<string> = (config, websiteId) => {
  // Add remote-notification to UIBackgroundModes
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    if (!modes.includes("remote-notification")) {
      config.modResults.UIBackgroundModes = [...modes, "remote-notification"];
    }
    return config;
  });

  // Add aps-environment entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] = "production";
    return config;
  });

  // Configure AppDelegate for push notifications
  config = withAppDelegate(config, (config) => {
    const { language, contents } = config.modResults;

    if (language === "swift") {
      console.log(
        "[expo-crisp-sdk] Detected Swift AppDelegate - injecting notification configuration",
      );
      config.modResults.contents = addSwiftNotificationSupport(contents, websiteId);
    } else if (["objc", "objcpp"].includes(language)) {
      console.log(
        "[expo-crisp-sdk] Detected Objective-C AppDelegate - injecting notification configuration",
      );
      config.modResults.contents = addObjcNotificationSupport(contents, websiteId);
    }

    return config;
  });

  return config;
};

function addSwiftNotificationSupport(src: string, websiteId: string): string {
  let modifiedSrc = src;

  // Add import
  if (!modifiedSrc.includes("import Crisp")) {
    const importResult = mergeContents({
      tag: "expo-crisp-sdk-import",
      src: modifiedSrc,
      newSrc: "import Crisp",
      anchor: /import Expo/,
      offset: 1,
      comment: "//",
    });
    modifiedSrc = importResult.contents;
  }

  // Add CrispSDK.configure and registerForRemoteNotifications
  if (!modifiedSrc.includes("CrispSDK.configure")) {
    const configureResult = mergeContents({
      tag: "expo-crisp-sdk-configure",
      src: modifiedSrc,
      newSrc: `    // Crisp: Configure SDK and register for push notifications
    CrispSDK.configure(websiteID: "${websiteId}")
    DispatchQueue.main.async {
      application.registerForRemoteNotifications()
    }`,
      anchor: /didFinishLaunchingWithOptions/,
      offset: 4,
      comment: "//",
    });
    modifiedSrc = configureResult.contents;
  }

  // Check if the device token method already exists
  const hasExistingMethod = modifiedSrc.includes(
    "func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data)",
  );

  if (hasExistingMethod) {
    // If method exists, insert the code inside it
    const tokenResult = mergeContents({
      tag: "expo-crisp-sdk-token",
      src: modifiedSrc,
      newSrc: "CrispSDK.setDeviceToken(deviceToken)",
      anchor:
        /func application\(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data\) \{/,
      offset: 1,
      comment: "//",
    });
    modifiedSrc = tokenResult.contents;
  } else {
    // If method doesn't exist, add the entire method before the closing brace
    const tokenResult = mergeContents({
      tag: "expo-crisp-sdk-token-method",
      src: modifiedSrc,
      newSrc: `
  public override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    CrispSDK.setDeviceToken(deviceToken)
  }
`,
      anchor: /^}/m,
      offset: 0,
      comment: "//",
    });
    modifiedSrc = tokenResult.contents;
  }

  return modifiedSrc;
}

function addObjcNotificationSupport(src: string, websiteId: string): string {
  let modifiedSrc = src;

  // Add import
  if (!modifiedSrc.includes("#import <Crisp/Crisp-Swift.h>")) {
    const importResult = mergeContents({
      tag: "expo-crisp-sdk-import",
      src: modifiedSrc,
      newSrc: "#import <Crisp/Crisp-Swift.h>",
      anchor: /#import "AppDelegate\.h"/,
      offset: 1,
      comment: "//",
    });
    modifiedSrc = importResult.contents;
  }

  // Add CrispSDK configure and registerForRemoteNotifications
  if (!modifiedSrc.includes("[CrispSDK configureWithWebsiteID")) {
    const configureResult = mergeContents({
      tag: "expo-crisp-sdk-configure",
      src: modifiedSrc,
      newSrc: `  // Crisp: Configure SDK and register for push notifications
  [CrispSDK configureWithWebsiteID:@"${websiteId}"];
  [[UIApplication sharedApplication] registerForRemoteNotifications];`,
      anchor:
        /- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions/,
      offset: 2,
      comment: "//",
    });
    modifiedSrc = configureResult.contents;
  }

  // Check if the device token method already exists
  const hasExistingMethod = modifiedSrc.includes(
    "- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken",
  );

  if (hasExistingMethod) {
    // If method exists, insert the code inside it
    const tokenResult = mergeContents({
      tag: "expo-crisp-sdk-token",
      src: modifiedSrc,
      newSrc: `[CrispSDK setDeviceToken:deviceToken];`,
      anchor:
        /- \(void\)application:\(UIApplication \*\)application didRegisterForRemoteNotificationsWithDeviceToken:\(NSData \*\)deviceToken/,
      offset: 2,
      comment: "//",
    });
    modifiedSrc = tokenResult.contents;
  } else {
    // If method doesn't exist, add the entire method before @end
    const tokenResult = mergeContents({
      tag: "expo-crisp-sdk-token-method",
      src: modifiedSrc,
      newSrc: `
// Crisp: Forward device token for push notifications
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [CrispSDK setDeviceToken:deviceToken];
  [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
`,
      anchor: /@end/,
      offset: 0,
      comment: "//",
    });
    modifiedSrc = tokenResult.contents;
  }

  return modifiedSrc;
}
