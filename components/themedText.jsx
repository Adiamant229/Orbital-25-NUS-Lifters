import { Text } from "react-native";
import { Colors } from "../constants/colors";
import { useThemeContext } from "./themedContext";

const ThemedText = ({ style, title = false, ...props }) => {
  const { theme } = useThemeContext();
  const themeColors = Colors[theme] ?? Colors.light;

  const textColor = title ? themeColors.title : themeColors.text;

  return (
    <Text
      style={[{ color: textColor, fontWeight: "bold" }, style]}
      {...props}
    />
  );
};

export default ThemedText;
