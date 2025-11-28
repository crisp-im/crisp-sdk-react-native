import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import CrispButton from "../components/CrispButton"

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <CrispButton onPress={() => {}} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingRight: 30,
    paddingBottom: 10,
  },
})
