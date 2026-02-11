import {
  type CrispLogEntry,
  CrispLogLevel,
  configure,
  getSDKVersion,
  type PushNotificationPayload,
  resetSession,
  setLogLevel,
  setShouldPromptForNotificationPermission,
  setTokenId,
  setUserCompany,
  setUserEmail,
  setUserNickname,
  setUserPhone,
  show,
  showMessage,
  useCrispEvents,
} from "expo-crisp-sdk";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CrispButton from "../components/CrispButton";
import { useExpoNotifications } from "../contexts/ExpoNotificationsContext";

// 1. Get your Website ID from https://app.crisp.chat/settings/websites/
const WEBSITE_ID = process.env.EXPO_PUBLIC_CRISP_WEBSITE_ID!;

// Extended log entry with unique ID for React keys
type LogEntryWithId = CrispLogEntry & { id: string };

// Counter for generating unique log IDs
let logIdCounter = 0;

// Helper to get log level name
const getLogLevelName = (level: CrispLogLevel): string => {
  const names: Record<CrispLogLevel, string> = {
    [CrispLogLevel.VERBOSE]: "VERBOSE",
    [CrispLogLevel.DEBUG]: "DEBUG",
    [CrispLogLevel.INFO]: "INFO",
    [CrispLogLevel.WARN]: "WARN",
    [CrispLogLevel.ERROR]: "ERROR",
    [CrispLogLevel.ASSERT]: "ASSERT",
  };
  return names[level] ?? "UNKNOWN";
};

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chatStatus, setChatStatus] = useState<"closed" | "open">("closed");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntryWithId[]>([]);
  const [currentLogLevel, setCurrentLogLevel] = useState<CrispLogLevel>(CrispLogLevel.DEBUG);
  const [lastNotification, setLastNotification] = useState<PushNotificationPayload | null>(null);

  const {
    expoPushToken,
    lastNotification: lastExpoNotification,
    requestPermission,
    sendLocalNotification,
    sendPushNotification,
  } = useExpoNotifications();

  console.log("SDK Version:", getSDKVersion());

  // Test Events Callbacks
  useCrispEvents({
    onSessionLoaded: (id) => {
      console.log("[Crisp] Session loaded:", id);
      setSessionId(id);
    },
    onChatOpened: () => {
      console.log("[Crisp] Chat opened");
      setChatStatus("open");
    },
    onChatClosed: () => {
      console.log("[Crisp] Chat closed");
      setChatStatus("closed");
    },
    onMessageSent: (message) => {
      console.log("[Crisp] Message sent:", message);
    },
    onMessageReceived: (message) => {
      console.log("[Crisp] Message received:", message);
    },
    // Push notification callback - fires when Crisp notification received in foreground
    onPushNotificationReceived: (notification) => {
      console.log("[Crisp] Push notification received:", notification);
      setLastNotification(notification);
    },
    // Logger callback - receives logs from native SDK
    onLogReceived: (log) => {
      console.log(`[Crisp Log] [${getLogLevelName(log.level)}] ${log.tag}: ${log.message}`);
      // Add unique ID and keep last 20 logs
      const logWithId: LogEntryWithId = {
        ...log,
        id: `log-${++logIdCounter}`,
      };
      setLogs((prev) => [...prev.slice(-19), logWithId]);
    },
  });

  useEffect(() => {
    // 2. Configure Crisp with your Website ID (required before any other call)
    configure(WEBSITE_ID);

    // 3. Enable debug logging to receive logs via onLogReceived
    setLogLevel(CrispLogLevel.DEBUG);
  }, []);

  // Change log level dynamically
  const handleSetLogLevel = (level: CrispLogLevel) => {
    setLogLevel(level);
    setCurrentLogLevel(level);
    setLogs([]); // Clear logs when changing level
  };

  // 3. Optional: Set user information when they log in
  const handleLogin = () => {
    // Use a unique token to persist sessions across devices
    setTokenId("e041988c-fe41-4901-88b5-4953e1513b9e");

    // Set user details
    setUserEmail("armand_petit@outlook.fr");
    setUserNickname("Armand PETIT");
    setUserPhone("+33783949275");

    // Add company information with full details
    setUserCompany({
      name: "Crisp",
      url: "https://crisp.chat/",
      companyDescription: "Customer Messaging Platform",
      employment: {
        title: "Software Engineer",
        role: "Engineering",
      },
      geolocation: {
        city: "Nantes",
        country: "FR",
      },
    });

    setIsLoggedIn(true);
  };

  // 4. Clear session when user logs out
  const handleLogout = () => {
    setTokenId(null);
    resetSession();
    setIsLoggedIn(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expo Crisp SDK</Text>
        <Text style={styles.subtitle}>Example App</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>User Session</Text>

        {!isLoggedIn ? (
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login (Set User Info)</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout (Reset Session)</Text>
          </Pressable>
        )}

        <Text style={styles.hint}>
          {isLoggedIn
            ? "User info set. Tap the chat button to talk with support."
            : "Login to set user information, then open the chat."}
        </Text>

        <Text style={styles.sectionTitle}>Events Callbacks Test</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Chat Status:</Text>
            <View
              style={[
                styles.statusBadge,
                chatStatus === "open" ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              <Text style={styles.statusBadgeText}>{chatStatus.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Session ID: </Text>
            <Text style={styles.statusValue}>{sessionId ?? "Not loaded"}</Text>
          </View>
        </View>
        <Text style={styles.hint}>
          Open/close the chat to see events fire. Check console for message events.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Show Message Test</Text>
        <View style={styles.messageButtons}>
          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              showMessage({
                type: "text",
                text: "Hello from Crisp Team !",
              });
              console.log("[Crisp] Showed text message");
            }}
          >
            <Text style={styles.buttonText}>Text Message</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              showMessage({
                type: "picker",
                id: "rating",
                text: "How would you rate our service?",
                choices: [
                  { value: "great", label: "Great!", selected: false },
                  { value: "ok", label: "It's okay", selected: false },
                  {
                    value: "poor",
                    label: "Could be better 😕",
                    selected: false,
                  },
                ],
              });
              console.log("[Crisp] Showed picker message");
            }}
          >
            <Text style={styles.buttonText}>Picker Message</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              showMessage({
                type: "field",
                id: "email",
                text: "What's your email address?",
                explain: "We'll send you a confirmation",
                required: true,
              });
              console.log("[Crisp] Showed field message");
            }}
          >
            <Text style={styles.buttonText}>Field Message</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>Tap a button then open the chat to see the message appear.</Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Push Notifications (Coexistence)
        </Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Mode:</Text>
            <View style={[styles.statusBadge, styles.statusOpen]}>
              <Text style={styles.statusBadgeText}>COEXISTENCE</Text>
            </View>
          </View>
          {lastNotification && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Title:</Text>
                <Text style={styles.statusValue}>{lastNotification.title}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Body:</Text>
                <Text style={styles.statusValue}>{lastNotification.body}</Text>
              </View>
            </>
          )}
        </View>
        <View style={[styles.messageButtons, { marginTop: 12 }]}>
          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              setShouldPromptForNotificationPermission(false);
              console.log("[Crisp] Disabled auto notification prompt");
            }}
          >
            <Text style={styles.buttonText}>Disable Auto Prompt</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          Push notification events will appear above when a Crisp notification arrives while the app
          is in the foreground.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Expo Notifications (Coexistence Test)
        </Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Push Token:</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {expoPushToken ?? "Not registered"}
            </Text>
          </View>
          {lastExpoNotification && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Title:</Text>
                <Text style={styles.statusValue}>
                  {lastExpoNotification.request.content.title ?? "—"}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Body:</Text>
                <Text style={styles.statusValue}>
                  {lastExpoNotification.request.content.body ?? "—"}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Data:</Text>
                <Text style={styles.statusValue} numberOfLines={1}>
                  {JSON.stringify(lastExpoNotification.request.content.data)}
                </Text>
              </View>
            </>
          )}
        </View>
        <View style={[styles.messageButtons, { marginTop: 12 }]}>
          <Pressable style={[styles.button, styles.expoNotifButton]} onPress={requestPermission}>
            <Text style={styles.buttonText}>Request Permission</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.expoNotifButton]}
            onPress={sendLocalNotification}
          >
            <Text style={styles.buttonText}>Send Local Notification</Text>
          </Pressable>
          {expoPushToken && (
            <Pressable
              style={[styles.button, styles.expoNotifButton]}
              onPress={sendPushNotification}
            >
              <Text style={styles.buttonText}>Send via Expo Push</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.hint}>
          Test expo-notifications alongside Crisp. Request permission, then use local or push
          notifications. Both should work without conflicts.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Logger Test</Text>
        <View style={styles.logLevelButtons}>
          {[
            { level: CrispLogLevel.DEBUG, label: "DEBUG" },
            { level: CrispLogLevel.INFO, label: "INFO" },
            { level: CrispLogLevel.WARN, label: "WARN" },
            { level: CrispLogLevel.ERROR, label: "ERROR" },
          ].map(({ level, label }) => (
            <Pressable
              key={level}
              style={[
                styles.logLevelButton,
                currentLogLevel === level && styles.logLevelButtonActive,
              ]}
              onPress={() => handleSetLogLevel(level)}
            >
              <Text
                style={[
                  styles.logLevelButtonText,
                  currentLogLevel === level && styles.logLevelButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>
          Current level: {getLogLevelName(currentLogLevel)}. Logs at or above this level will appear
          below.
        </Text>

        {logs.length > 0 && (
          <View style={styles.logsContainer}>
            <View style={styles.logsHeader}>
              <Text style={styles.logsTitle}>Recent Logs ({logs.length})</Text>
              <Pressable onPress={() => setLogs([])}>
                <Text style={styles.clearButton}>Clear</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.logsList}>
              {logs.map((log) => (
                <View key={log.id} style={styles.logEntry}>
                  <Text
                    style={[
                      styles.logLevel,
                      log.level >= CrispLogLevel.ERROR && styles.logLevelError,
                      log.level === CrispLogLevel.WARN && styles.logLevelWarn,
                      log.level === CrispLogLevel.INFO && styles.logLevelInfo,
                    ]}
                  >
                    [{getLogLevelName(log.level)}]
                  </Text>
                  <Text style={styles.logTag}>{log.tag}:</Text>
                  <Text style={styles.logMessage} numberOfLines={2}>
                    {log.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* 5. Floating chat button - tap to open Crisp chat */}
      <CrispButton onPress={() => show()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Space for the floating button
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0066FF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginTop: 16,
    lineHeight: 20,
  },
  statusContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
  },
  statusValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontFamily: "monospace",
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: "#d4edda",
  },
  statusClosed: {
    backgroundColor: "#f8d7da",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  messageButtons: {
    gap: 12,
  },
  messageButton: {
    backgroundColor: "#6c757d",
  },
  expoNotifButton: {
    backgroundColor: "#7c3aed",
  },
  logLevelButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  logLevelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e9ecef",
    borderWidth: 2,
    borderColor: "transparent",
  },
  logLevelButtonActive: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  logLevelButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
  },
  logLevelButtonTextActive: {
    color: "#fff",
  },
  logsContainer: {
    marginTop: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
  },
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
  },
  clearButton: {
    fontSize: 12,
    color: "#0066FF",
    fontWeight: "600",
  },
  logsList: {
    flex: 1,
  },
  logEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 4,
  },
  logLevel: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#6c757d",
    fontWeight: "600",
  },
  logLevelError: {
    color: "#dc3545",
  },
  logLevelWarn: {
    color: "#ffc107",
  },
  logLevelInfo: {
    color: "#17a2b8",
  },
  logTag: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#888",
  },
  logMessage: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#ccc",
    flex: 1,
  },
});
