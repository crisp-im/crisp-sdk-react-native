import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Crisp from "expo-crisp-sdk"
import CrispButton from "../components/CrispButton"

// 1. Get your Website ID from https://app.crisp.chat/settings/websites/
const WEBSITE_ID = "YOUR_WEBSITE_ID"

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // 2. Configure Crisp with your Website ID (required before any other call)
    Crisp.configure(WEBSITE_ID)
  }, [])

  // 3. Optional: Set user information when they log in
  const handleLogin = () => {
    // Use a unique token to persist sessions across devices
    Crisp.setTokenId("e041988c-fe41-4901-88b5-4953e1513b9e")

    // Set user details
    Crisp.setUserEmail("armand_petit@outlook.fr")
    Crisp.setUserNickname("Armand PETIT")
    Crisp.setUserPhone("+33783949275")

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
    })

    setIsLoggedIn(true)
  }

  // 4. Clear session when user logs out
  const handleLogout = () => {
    Crisp.setTokenId(null)
    Crisp.resetSession()
    setIsLoggedIn(false)
  }

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
          <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout (Reset Session)</Text>
          </Pressable>
        )}

        <Text style={styles.hint}>
          {isLoggedIn
            ? "User info set. Tap the chat button to talk with support."
            : "Login to set user information, then open the chat."}
        </Text>
      </View>

      {/* 5. Floating chat button - tap to open Crisp chat */}
      <CrispButton onPress={() => Crisp.show()} />
    </SafeAreaView>
  )
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
})
