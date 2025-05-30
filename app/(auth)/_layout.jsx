import { Stack } from "expo-router";
import { StatusBar } from "react-native";

const AuthLayout = () => {
  return (
    <>
      {/* Correct prop name is 'style' not 'value' */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </>
  );
};

export default AuthLayout;
