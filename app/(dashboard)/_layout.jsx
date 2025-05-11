import { Tabs } from "expo-router"
import { useColorScheme } from "react-native";
import { Colors } from '../../constants/colors'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'


const dashBoardLayout = () => {
    const colorScheme = useColorScheme(); //returns light or dark or null 
    const theme = Colors[colorScheme] ?? Colors.light //defaults to light
    
    return (
        <Tabs
            screenOptions={{ headerShown: false, tabBarStyle: { 
                backgroundColor: theme.navBackground,
                paddingTop: 10,
                height: 90
            },
            tabBarActiveTintColor: theme.iconColorFocused,
            tabBarInactiveTintColor: theme.iconColor
        }}
        >         
            <Tabs.Screen 
                name="gymCapacity" 
                options={{ title: 'Capacity', tabBarIcon: ({ focused }) => (
                    <Ionicons 
                    size={24} 
                    name={focused ? "people" : 'people-outline'}
                    color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
            )}}
            />

            <Tabs.Screen 
                name="forum" 
                options={{ title: 'Forum', tabBarIcon: ({ focused }) => (
                    <MaterialCommunityIcons
                    size={24} 
                    name={focused ? "forum": "forum-outline"}
                    color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
            )}}
            />

            <Tabs.Screen 
                name="macro" 
                options={{ title: 'Macro', tabBarIcon: ({ focused }) => (
                    <MaterialCommunityIcons
                    size={24} 
                    name={focused ? "food-drumstick": "food-drumstick-outline"}
                    color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
            )}}
            />

            <Tabs.Screen 
                name="exercises" 
                options={{ title: 'Exercises', tabBarIcon: ({ focused }) => (
                    <MaterialCommunityIcons
                    size={24} 
                    name="dumbbell"
                    color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
            )}}
            />
            <Tabs.Screen 
                name="profile" 
                options={{ title: 'Profile', tabBarIcon: ({ focused }) => (
                    <Ionicons 
                    size={24} 
                    name={focused ? 'person' : 'person-outline'}
                    color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
            )}}
            />            
                        
            

        
        </Tabs>
    )
}

export default dashBoardLayout
