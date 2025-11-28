import { SafeAreaView, StyleSheet, Text } from "react-native"

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Expo Crisp SDK</Text>
      <Text style={styles.subtitle}>Example App</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
})
