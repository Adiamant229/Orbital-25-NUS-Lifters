import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";

function themedButton({ style, ...props }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      {...props}
    />
  );
}

export default themedButton;

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 6,
    marginVertical: 10,
  },

  pressed: {
    opacity: 0.5,
  },
});
