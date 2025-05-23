import { TextInput, useColorScheme } from "react-native";
import { Colors } from "../constants/colors";

const themedTextInput = ({ style, ...props }) => {
  const colorScheme = useColorScheme(); //returns light or dark or null
  const theme = Colors[colorScheme] ?? Colors.light; //defaults to light

  return (
    <TextInput
      style={[
        {
          backgroundColor: theme.uiBackground,
          color: theme.text,
          padding: 20,
          borderRadius: 6,
        },
        style
      ]}
      {...props}
    />
  );
};

export default themedTextInput;
