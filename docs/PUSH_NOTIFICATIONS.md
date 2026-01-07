# Push Notifications Setup Guide

This guide walks you through configuring push notifications for the Crisp SDK on iOS and Android.

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

| Environment              | Description                      | Use Case                                                     |
| ------------------------ | -------------------------------- | ------------------------------------------------------------ |
| **Sandbox**              | Development/testing environment  | Local development builds, debug builds from Xcode            |
| **Production**           | Live environment                 | App Store releases, TestFlight builds                        |
| **Sandbox & Production** | Both environments                | Recommended for flexibility during development and production |

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

   | Field           | Description                                        | Where to find it                                                                                                                       |
   | --------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
   | **Certificate** | Your `.p8` APNs key file                           | Downloaded in Step 3                                                                                                                   |
   | **Team ID**     | Your Apple Developer Team identifier (10 characters) | [Apple Developer Account](https://developer.apple.com/account) > Membership details, or visible in Xcode under Signing & Capabilities |
   | **Bundle ID**   | Your app's bundle identifier                       | Defined in your `app.json` (`expo.ios.bundleIdentifier`) or Xcode project settings                                                     |
   | **Key ID**      | The APNs key identifier (10 characters)            | Shown after creating the key, or in your Keys list                                                                                     |

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
