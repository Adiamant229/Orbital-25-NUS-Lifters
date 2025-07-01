import { Stack } from "expo-router";
import { StatusBar } from "react-native";

const ProfilesLayout = () => {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </>
  );
};

export default ProfilesLayout;
