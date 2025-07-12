//react and expo imports
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { Colors } from "../constants/colors";
import { StatusBar } from "expo-status-bar";

const RootLayout = () => {
  //use light or dark theme based on system
  const colorScheme = useColorScheme(); //returns light or dark or null
  const theme = Colors[colorScheme] ?? Colors.light; //defaults to light

  return (
    <>
      <StatusBar value="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.navBackground },
          headerTintColor: theme.title,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Screen
          name="(reports)"
          options={{ title: "Gym Facility Info" }}
        />

        <Stack.Screen
          name="(progress)"
          options={{ title: "Progress Tracker" }}
        />
        <Stack.Screen
          name="(guide)"
          options={{ title: "Gym Info and Guide" }}
        />
      </Stack>
    </>
  );
};

export default RootLayout;
