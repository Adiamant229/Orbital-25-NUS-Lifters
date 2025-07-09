import { View } from "react-native";
import { Colors } from "../constants/colors";
import { useThemeContext } from "./themedContext";

const ThemedView = ({ style, ...props }) => {
  const { theme } = useThemeContext();
  const themeColors = Colors[theme] ?? Colors.light;

  return (
    <View
      style={[{ backgroundColor: themeColors.background }, style]}
      {...props}
    />
  );
};

export default ThemedView;
