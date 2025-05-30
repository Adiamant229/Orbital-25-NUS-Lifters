import { TextInput, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/colors";

const ThemedTextInput = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <TextInput
      style={[
        {
          backgroundColor: theme.uiBackground,
          color: theme.text,
        },
        styles.input,
        style, // allow overrides
      ]}
       autoCapitalize="none"
      {...props}
    />
  );
};

export default ThemedTextInput;

const styles = StyleSheet.create({
  input: {
    width: "80%",
    padding: 20,
    borderRadius: 6,
    marginBottom: 10,
  },
});
