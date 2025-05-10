import { Stack } from 'expo-router'
import { StatusBar } from 'react-native'

const AuthLayout = () => {
  return ( //statusBar auto means time and battery level white and black 
    <>
    <StatusBar value="auto" /> 
    <Stack 
        screenOptions={{ headerShown: false, animation: "none" }}
    />
    </>
  )
}

export default AuthLayout