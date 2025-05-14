import { View } from "react-native";

const spacer = ({ width = "100%", height = 40 }) => {
  return <View style={{ width, height }} />;
};

export default spacer;
