import Crisp, { useCrispEvents, getSDKVersion } from "expo-crisp-sdk";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CrispButton from "../components/CrispButton";

// 1. Get your Website ID from https://app.crisp.chat/settings/websites/
const WEBSITE_ID = "YOUR_WEBSITE_ID";

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chatStatus, setChatStatus] = useState<"closed" | "open">("closed");
  const [sessionId, setSessionId] = useState<string | null>(null);

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
  });

  useEffect(() => {
    // 2. Configure Crisp with your Website ID (required before any other call)
    Crisp.configure(WEBSITE_ID);
  }, []);

  // 3. Optional: Set user information when they log in
  const handleLogin = () => {
    // Use a unique token to persist sessions across devices
    Crisp.setTokenId("e041988c-fe41-4901-88b5-4953e1513b9e");

    // Set user details
    Crisp.setUserEmail("armand_petit@outlook.fr");
    Crisp.setUserNickname("Armand PETIT");
    Crisp.setUserPhone("+33783949275");

    // Add company information with full details
    Crisp.setUserCompany({
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
    Crisp.setTokenId(null);
    Crisp.resetSession();
    setIsLoggedIn(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expo Crisp SDK</Text>
        <Text style={styles.subtitle}>Example App</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>User Session</Text>

        {!isLoggedIn ? (
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login (Set User Info)</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
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
              <Text style={styles.statusBadgeText}>
                {chatStatus.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Session ID: </Text>
            <Text style={styles.statusValue}>{sessionId ?? "Not loaded"}</Text>
          </View>
        </View>
        <Text style={styles.hint}>
          Open/close the chat to see events fire. Check console for message
          events.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Show Message Test
        </Text>
        <View style={styles.messageButtons}>
          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              Crisp.showMessage({
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
              Crisp.showMessage({
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
              Crisp.showMessage({
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
        <Text style={styles.hint}>
          Tap a button then open the chat to see the message appear.
        </Text>
      </View>

      {/* 5. Floating chat button - tap to open Crisp chat */}
      <CrispButton onPress={() => Crisp.show()} />
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
});
