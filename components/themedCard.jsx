import {  StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Colors } from "../constants/colors";

const ThemedCard = ({ style, ...props }) => {
  const colorScheme = useColorScheme(); //returns light or dark or null
  const theme = Colors[colorScheme] ?? Colors.light; //defaults to light

  return (
    <TouchableOpacity
      style={[{ backgroundColor: theme.uiBackground }, styles.card, style]}
      {...props}
    />
  );
};

export default ThemedCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    width: 110,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 5,
  },
});
