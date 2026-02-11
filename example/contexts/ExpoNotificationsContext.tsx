import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const PROJECT_ID = "b4b2b778-1d00-4f5d-a873-68dc2f36b6fe";

interface ExpoNotificationsContextValue {
  expoPushToken: string | null;
  lastNotification: Notifications.Notification | null;
  requestPermission: () => Promise<void>;
  sendLocalNotification: () => Promise<void>;
  sendPushNotification: () => Promise<void>;
}

const ExpoNotificationsContext = createContext<ExpoNotificationsContextValue | null>(null);

export function useExpoNotifications() {
  const context = useContext(ExpoNotificationsContext);
  if (!context) {
    throw new Error("useExpoNotifications must be used within ExpoNotificationsProvider");
  }
  return context;
}

export function ExpoNotificationsProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[ExpoNotif] Received:", notification);
      setLastNotification(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[ExpoNotif] Tapped:", response);
      setLastNotification(response.notification);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const requestPermission = async () => {
    if (!Device.isDevice) {
      console.log("[ExpoNotif] Must use physical device for push notifications");
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[ExpoNotif] Permission not granted");
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    setExpoPushToken(tokenData.data);
    console.log("[ExpoNotif] Token:", tokenData.data);
  };

  const sendLocalNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Local Notification",
        body: "This is a local test notification from expo-notifications",
        data: { source: "local-test" },
      },
      trigger: null,
    });
    console.log("[ExpoNotif] Local notification sent");
  };

  const sendPushNotification = async () => {
    if (!expoPushToken) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        title: "Expo Push Test",
        body: "This is a test push via Expo Push API",
        data: { source: "expo-notifications-test" },
      }),
    });
    console.log("[ExpoNotif] Push sent via Expo API");
  };

  return (
    <ExpoNotificationsContext.Provider
      value={{
        expoPushToken,
        lastNotification,
        requestPermission,
        sendLocalNotification,
        sendPushNotification,
      }}
    >
      {children}
    </ExpoNotificationsContext.Provider>
  );
}
