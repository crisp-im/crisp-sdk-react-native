import { Image, StyleSheet, TouchableOpacity } from "react-native"

interface CrispButtonProps {
  onPress: () => void
}

export default function CrispButton({ onPress }: CrispButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Image source={require("../assets/logo_crisp.png")} style={styles.image} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 40,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
})
