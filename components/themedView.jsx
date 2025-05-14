import { View, useColorScheme } from "react-native";
import { Colors } from "../constants/colors";

const ThemedView = ({ style, ...props }) => {
  const colorScheme = useColorScheme(); //returns light or dark or null
  const theme = Colors[colorScheme] ?? Colors.light; //defaults to light

  return (
    <View style={[{ backgroundColor: theme.background }, style]} {...props} />
  );
};

export default ThemedView;
