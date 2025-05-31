//react and expo imports 
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { Colors } from "../constants/colors";
import { StatusBar } from "expo-status-bar";

const RootLayout = () => {
  //use light or dark theme based on system
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

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
          name="gymReports"
          options={{ title: "Latest Reports & Issues " }}
        />
        <Stack.Screen
          name="exercises"
          options={{ title: "Gym Info and Guide" }}
        />
      </Stack>
    </>
  );
};

export default RootLayout;
