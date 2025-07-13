// react and expo imports
import { Tabs } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../../components/themedContext";
import { Colors } from "../../constants/colors";

const DashboardLayout = () => {
  const { theme } = useThemeContext();
  const themeColors = Colors[theme] ?? Colors.light;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: themeColors.navBackground }}
        edges={["bottom", "left", "right"]}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: themeColors.navBackground,
              paddingTop: 5,
              height: 30,
              elevation: 0,
              shadowColor: "transparent",
              borderTopWidth: 0,
            },
            tabBarActiveTintColor: themeColors.iconColorFocused,
            tabBarInactiveTintColor: themeColors.iconColor,
          }}
        >
          <Tabs.Screen
            name="gymCapacity"
            options={{
              title: "",
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  size={26}
                  name={focused ? "people" : "people-outline"}
                  color={
                    focused
                      ? themeColors.iconColorFocused
                      : themeColors.iconColor
                  }
                />
              ),
            }}
          />

          <Tabs.Screen
            name="forum"
            options={{
              title: "",
              tabBarIcon: ({ focused }) => (
                <MaterialCommunityIcons
                  size={26}
                  name={focused ? "forum" : "forum-outline"}
                  color={
                    focused
                      ? themeColors.iconColorFocused
                      : themeColors.iconColor
                  }
                />
              ),
            }}
          />

          <Tabs.Screen
            name="macro"
            options={{
              title: "",
              tabBarIcon: ({ focused }) => (
                <MaterialIcons
                  size={26}
                  name="local-dining"
                  color={
                    focused
                      ? themeColors.iconColorFocused
                      : themeColors.iconColor
                  }
                />
              ),
            }}
          />

          <Tabs.Screen
            name="progressTracker"
            options={{
              title: "",
              tabBarIcon: ({ focused }) => (
                <FontAwesome6
                  name="chart-line"
                  size={26}
                  color={
                    focused
                      ? themeColors.iconColorFocused
                      : themeColors.iconColor
                  }
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "",
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  size={26}
                  name={focused ? "person" : "person-outline"}
                  color={
                    focused
                      ? themeColors.iconColorFocused
                      : themeColors.iconColor
                  }
                />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default DashboardLayout;
