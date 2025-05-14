import { StyleSheet, View, useColorScheme } from "react-native";
import { Colors } from "../constants/colors";

const ThemedCard = ({ style, ...props }) => {
  const colorScheme = useColorScheme(); //returns light or dark or null
  const theme = Colors[colorScheme] ?? Colors.light; //defaults to light

  return (
    <View
      style={[{ backgroundColor: theme.uiBackground }, styles.card, style]}
      {...props}
    />
  );
};

export default ThemedCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eee",
    padding: 20,
    borderRadius: 5,
    boxShadow: "4px 4px rgba(0,0,0,0.1)",
  },
});
