import { Stack } from "expo-router";
import { StatusBar } from "react-native";

const ForumLayout = () => {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </>
  );
};

export default ForumLayout;
