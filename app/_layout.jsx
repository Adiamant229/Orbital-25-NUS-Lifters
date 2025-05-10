import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import { Stack } from 'expo-router'
import { Colors } from "../constants/colors"
import { StatusBar } from 'expo-status-bar'

const RootLayout = () => {
    //use light or dark theme based on system 
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light


  return ( //statusBar auto means time and battery level white and black 
    <>
    <StatusBar value="auto" /> 
     <Stack screenOptions={{ 
        headerStyle: { backgroundColor: theme.navBackground },
        headerTintColor: theme.title, 
     }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false}} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false}} />
        <Stack.Screen name="index" options={{title: 'Home'}} />
     </Stack>
    </>
  )
}

export default RootLayout

const styles = StyleSheet.create({})