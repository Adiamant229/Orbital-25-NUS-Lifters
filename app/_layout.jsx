//react and expo imports
import { ThemeProvider, useThemeContext } from "../components/themedContext"; // make sure this file exports both
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../constants/colors";

// Inner layout with access to theme context
const InnerLayout = () => {
  const { theme } = useThemeContext();
  const themeColors = Colors[theme] ?? Colors.light;

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeColors.navBackground },
          headerTintColor: themeColors.title,
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

        <Stack.Screen name="(profiles)" options={{ title: "" }} />

        <Stack.Screen name="(forum)" options={{ title: "" }} />
      </Stack>
    </>
  );
};

// Wrap inner layout in ThemeProvider
const RootLayout = () => {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
};

export default RootLayout;
