import { Pressable, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

const ThemedButton = ({ style, ...props }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      {...props}
    />
  );
}

export default ThemedButton;

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 110,
    padding: 18,
    borderRadius: 20,
    marginVertical: 10,
  },

  pressed: {
    opacity: 0.5,
  },
});
