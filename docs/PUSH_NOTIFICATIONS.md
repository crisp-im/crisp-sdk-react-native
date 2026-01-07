# Push Notifications Setup Guide

This guide walks you through configuring push notifications for the Crisp SDK on iOS and Android.

## Table of Contents

- [Prerequisites](#prerequisites)
- [iOS Setup (APNs)](#ios-setup-apns)
- [Android Setup (Firebase Cloud Messaging)](#android-setup-firebase-cloud-messaging)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Enabled the config plugin in your `app.json` (see [README](../README.md#push-notifications-config-plugin))
- [ ] A Crisp account with access to your Website settings
- [ ] For iOS: An Apple Developer account
- [ ] For Android: A Firebase project

---

## iOS Setup (APNs)

### Step 1: Create an APNs Key

1. Go to your [Apple Developer Account - Keys](https://developer.apple.com/account/resources/authkeys/list)

2. Click the **+** button to create a new key

   <img width="1251" height="380" alt="Create-APNs-Key" src="https://github.com/user-attachments/assets/744d1ab1-c734-459c-a7ed-2db00dccff35" />

3. Enter a **Key Name** (e.g., "Crisp Push Notifications")

4. Check the **Apple Push Notifications service (APNs)** checkbox

5. Click **Configure** to set up the environment

   <img width="1282" height="712" alt="Check-APNs-key" src="https://github.com/user-attachments/assets/83fcc472-75a2-45fe-b280-dd9468701ede" />

### Step 2: Choose the APNs Environment

When configuring the key, you must select which APNs environment(s) your key will support:

| Environment              | Description                     | Use Case                                                      |
| ------------------------ | ------------------------------- | ------------------------------------------------------------- |
| **Sandbox**              | Development/testing environment | Local development builds, debug builds from Xcode             |
| **Production**           | Live environment                | App Store releases, TestFlight builds                         |
| **Sandbox & Production** | Both environments               | Recommended for flexibility during development and production |

#### Understanding APNs Environments

Apple maintains two completely separate push notification environments:

- **Sandbox**: Used when your app is built with a development provisioning profile (running from Xcode, debug builds). Device tokens generated in sandbox are **only valid for sandbox**.

- **Production**: Used when your app is distributed via TestFlight or the App Store. Device tokens generated in production are **only valid for production**.

> [!IMPORTANT]
> Device tokens are environment-specific. A token from a development build will NOT work for production notifications, and vice versa.

**Recommendation**: Select **"Sandbox & Production"** to have maximum flexibility. This allows the same key to work for both development testing and production releases.

### Step 3: Register and Download the Key

1. After configuring the environment, click **Continue**

2. Review your configuration and click **Register**

3. **Download** your `.p8` certificate file immediately

> [!WARNING]
> The `.p8` file can only be downloaded once. Store it securely as you cannot re-download it later.

4. Note down the **Key ID** displayed on the page (e.g., `V55RRC7V8R`) - you'll need this for Crisp

   <img width="1394" height="414" alt="Key-ID-APNs-Key" src="https://github.com/user-attachments/assets/fd2f931d-5602-4cf8-83fc-f9b908dcfaec" />

### Step 4: Configure Push Notifications in Crisp Dashboard

1. Go to [Crisp Dashboard](https://app.crisp.chat)

2. Navigate to **Settings** > **Chatbox** > **Push Notifications**

   <img width="1635" height="965" alt="Configure-Dashboard-APNs-key" src="https://github.com/user-attachments/assets/1e295575-0663-49a8-8c36-db7b39d9aa43" />

3. In the iOS section, provide the following information:

   | Field           | Description                                          | Where to find it                                                                                                                      |
   | --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
   | **Certificate** | Your `.p8` APNs key file                             | Downloaded in Step 3                                                                                                                  |
   | **Team ID**     | Your Apple Developer Team identifier (10 characters) | [Apple Developer Account](https://developer.apple.com/account) > Membership details, or visible in Xcode under Signing & Capabilities |
   | **Bundle ID**   | Your app's bundle identifier                         | Defined in your `app.json` (`expo.ios.bundleIdentifier`) or Xcode project settings                                                    |
   | **Key ID**      | The APNs key identifier (10 characters)              | Shown after creating the key, or in your Keys list                                                                                    |

4. If you want to test with development builds, enable the **Sandbox mode** toggle in Crisp Dashboard

5. Click **Verify** to validate your credentials

### Step 5: Verify Xcode Configuration

After running `npx expo prebuild`, open your project in Xcode and verify:

1. Open **Signing & Capabilities** tab

2. Ensure the correct **Team** is selected (must match the Team ID you provided to Crisp)

3. Verify the **Bundle Identifier** matches what you configured in Crisp

4. Confirm these capabilities are present:
   - **Push Notifications** capability
   - **Background Modes** with **Remote notifications** checked

> [!NOTE]
> The expo-crisp-sdk config plugin automatically adds these capabilities when `notifications.enabled` is `true`.

<img width="1907" height="774" alt="Xcode-APNs-Key" src="https://github.com/user-attachments/assets/115cae98-ef02-489e-b5d9-16bc493e996c" />

### Important Notes for iOS

> [!WARNING]
> **Push notifications do NOT work on iOS Simulator.** You must test on a real device.

#### Environment Matching

Your build type must match your APNs key environment and Crisp Sandbox setting:

| Build Type                              | APNs Key Environment    | Crisp Sandbox Mode |
| --------------------------------------- | ----------------------- | ------------------ |
| Development build (Xcode/Expo prebuild) | Must include Sandbox    | Enabled            |
| TestFlight                              | Must include Production | Disabled           |
| App Store                               | Must include Production | Disabled           |

#### Checklist Before Testing

- [ ] APNs key environment matches your build type
- [ ] Crisp Sandbox mode matches your build type (enabled for dev, disabled for production)
- [ ] Team ID in Crisp matches your Apple Developer account
- [ ] Bundle ID in Crisp exactly matches your app's bundle identifier
- [ ] Key ID in Crisp matches your APNs key
- [ ] Testing on a real iOS device (not simulator)

Once Crisp confirms successful configuration, you're ready to receive push notifications!

---

## Android Setup (Firebase Cloud Messaging)

Android push notifications use Firebase Cloud Messaging (FCM). The setup consists of three parts:

1. **Firebase Console**: Create a project and get your credentials
2. **Crisp Dashboard**: Configure your Firebase credentials
3. **Your Project**: Add the configuration file and enable notifications

Let's start with Firebase.

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)

2. Click **Create a project** (or **Add project** if you already have projects)

3. Enter your **Project name** (e.g., "My App Crisp")

4. Choose whether to enable Google Analytics (optional)

5. Click **Create project** and wait for the setup to complete

### Step 2: Add an Android App to Your Firebase Project

1. From your Firebase project dashboard, click the **Android icon** to add an Android app

   <img width="571" height="163" alt="Add Android App to Firebase" src="https://github.com/user-attachments/assets/389d6f08-8d27-4875-a380-cbd86ceb3109" />

2. Enter your **Android package name**

> [!IMPORTANT]
> This must exactly match your `expo.android.package` value in `app.json`

3. (Optional) Enter an app nickname for identification in the Firebase Console

4. (Optional) Enter your SHA-1 signing certificate (not required for push notifications)

5. Click **Register app**

### Step 3: Download the Configuration File

1. After registering, click **Download google-services.json**

2. Place this file at the **root of your Expo project** (same level as `app.json`)

3. Update your `app.json` to reference the file:

   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json",
         "package": "com.yourcompany.yourapp"
       }
     }
   }
   ```

4. **Skip** the "Add Firebase SDK" step in Firebase Console - the expo-crisp-sdk plugin handles this automatically

5. Click **Continue to console**

> [!WARNING]
> Keep your `google-services.json` file secure. While it contains public identifiers, it's best practice not to expose it unnecessarily.

### Step 4: Get Your Firebase Credentials for Crisp

Now that your app is registered, you need to get two pieces of information from Firebase to configure Crisp:

#### 4.1: Get the Sender ID

1. In Firebase Console, click the **gear icon** next to "Project Overview"

   <img width="436" height="155" alt="Firebase Project Settings" src="https://github.com/user-attachments/assets/a03467d1-3b16-4019-8f93-bbab11407d73" />

2. Select **Project settings**

3. In the **Cloud Messaging** tab, find the **Sender ID**

   <img width="1161" height="579" alt="Firebase Sender ID" src="https://github.com/user-attachments/assets/9f33214a-b9f0-4ab0-a2c3-2e240cf1348b" />

> [!NOTE]
> The "Sender ID" IS your Project Number. Firebase uses these terms interchangeably.

4. Copy this number (e.g., `123456789012`)

#### 4.2: Generate a Private Key

1. Still in Project settings, go to the **Service accounts** tab

2. Click **Generate new private key**

3. Confirm by clicking **Generate key**

4. A JSON file will be downloaded automatically

   <img width="1142" height="748" alt="Generate Firebase Private Key" src="https://github.com/user-attachments/assets/ed60751e-3888-4b12-96bb-862e9cb4f8d4" />

> [!WARNING]
> Store this private key securely. It grants access to your Firebase project and should never be committed to version control or shared publicly.

### Step 5: Configure Push Notifications in Crisp Dashboard

With your Firebase credentials ready, let's configure Crisp to send push notifications.

1. Go to [Crisp Dashboard](https://app.crisp.chat)

2. Navigate to **Settings** > **Chatbox** > **Push Notifications**

3. In the Android section, provide the following information:

   | Field              | Description                              | Where to find it                                          |
   | ------------------ | ---------------------------------------- | --------------------------------------------------------- |
   | **Certificate**    | Your Firebase private key JSON file      | Downloaded in Step 4.2                                    |
   | **Project Number** | Your Firebase Sender ID (Project Number) | Firebase Console > Project settings > Cloud Messaging tab |

4. Click **Verify** to validate your credentials

5. If verification succeeds, the status will show as **live**

   <img width="1908" height="871" alt="Crisp Dashboard Android Configuration" src="https://github.com/user-attachments/assets/18758630-cb06-452b-a613-213eec4b1f5c" />

### Step 6: Configure Your Project

The final step is to add the Firebase configuration to your project. Choose the instructions based on your project type:

#### Expo CLI

1. Place the `google-services.json` file at the **root of your Expo project** (same level as `app.json`)

2. Update your `app.json` to reference the file and enable notifications:

   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-crisp-sdk",
           {
             "websiteId": "YOUR_WEBSITE_ID",
             "notifications": {
               "enabled": true
             }
           }
         ]
       ],
       "android": {
         "googleServicesFile": "./google-services.json",
         "package": "com.yourcompany.yourapp"
       }
     }
   }
   ```

3. Rebuild your project:

   ```bash
   npx expo prebuild --clean
   ```

> [!NOTE]
> The expo-crisp-sdk config plugin automatically adds Firebase Messaging dependencies and configures the native Android project when `notifications.enabled` is `true`.

#### React Native CLI

1. Place the `google-services.json` file in the **`android/app/`** directory of your project (at the app module level)

  <img width="424" height="440" alt="android_studio_project_panel@2x" src="https://github.com/user-attachments/assets/a7ac7873-502f-4684-aaf6-f7a3bd57b860" />

2. Follow the [Firebase Android Setup Guide](https://firebase.google.com/docs/android/setup) to configure your project

3. Add the Firebase Messaging dependency to your **app-level** `build.gradle` file (`android/app/build.gradle`):

   ```gradle
   dependencies {
       // ... other dependencies
       implementation 'com.google.firebase:firebase-messaging'
   }
   ```

4. Rebuild your project:

   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

### Checklist Before Testing

#### For Expo CLI

- [ ] `google-services.json` is at the root of your Expo project
- [ ] `googleServicesFile` path is correctly set in `app.json`
- [ ] Package name in Firebase matches `expo.android.package` in `app.json`
- [ ] `notifications.enabled` is `true` in the plugin configuration
- [ ] Private key JSON uploaded to Crisp Dashboard
- [ ] Sender ID entered in Crisp Dashboard
- [ ] Crisp verification shows **live** status
- [ ] App has been rebuilt with `npx expo prebuild --clean`

#### For React Native CLI

- [ ] `google-services.json` is in the `android/app/` directory
- [ ] Package name in Firebase matches `applicationId` in `android/app/build.gradle`
- [ ] Firebase Messaging dependency added to `build.gradle`
- [ ] Private key JSON uploaded to Crisp Dashboard
- [ ] Sender ID entered in Crisp Dashboard
- [ ] Crisp verification shows **live** status
- [ ] App has been rebuilt

Once Crisp confirms successful configuration, you're ready to receive push notifications on Android!
