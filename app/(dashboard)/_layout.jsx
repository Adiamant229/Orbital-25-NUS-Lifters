// react and expo imports
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// themed imports
import { Colors } from "../../constants/colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

const DashboardLayout = () => {
  const colorScheme = useColorScheme(); //returns light or dark or null
  const theme = Colors[colorScheme] ?? Colors.light; //defaults to light

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor:'black' }} edges={["bottom", "left", "right"]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.navBackground,
              paddingTop: 5,
              height: 75,
             
            },
            tabBarActiveTintColor: theme.iconColorFocused,
            tabBarInactiveTintColor: theme.iconColor,
          }}
        >
          <Tabs.Screen
            name="gymCapacity"
            options={{
              title: "Capacity",
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  size={24}
                  name={focused ? "people" : "people-outline"}
                  color={focused ? theme.iconColorFocused : theme.iconColor}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="forum"
            options={{
              title: "Forum",
              tabBarIcon: ({ focused }) => (
                <MaterialCommunityIcons
                  size={24}
                  name={focused ? "forum" : "forum-outline"}
                  color={focused ? theme.iconColorFocused : theme.iconColor}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="macro"
            options={{
              title: "Macro",
              tabBarIcon: ({ focused }) => (
                <MaterialIcons
                  size={24}
                  name="local-dining"
                  color={focused ? theme.iconColorFocused : theme.iconColor}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="progressTracker"
            options={{
              title: "Progress",
              tabBarIcon: ({ focused }) => (
                <MaterialCommunityIcons
                  size={24}
                  name="dumbbell"
                  color={focused ? theme.iconColorFocused : theme.iconColor}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  size={24}
                  name={focused ? "person" : "person-outline"}
                  color={focused ? theme.iconColorFocused : theme.iconColor}
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
