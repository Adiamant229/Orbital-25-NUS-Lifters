import { TouchableOpacity, StyleSheet, Image, Text } from 'react-native'
import { Link } from 'expo-router'
import Logo from '../assets/img/arnold.jpg'

import ThemedView from '../components/themedView'
import Spacer from '../components/spacer'
import ThemedText from '../components/themedText'

const Home = () => {
  return (
    <ThemedView style={styles.container}>
    
        <ThemedText style={styles.title} title = {true} >NUS Lifters!!!</ThemedText>
        
        <Spacer height = {10} />

        <ThemedText style={{fontSize: 16}}>Official NUS lifting club 2025</ThemedText>
        <Spacer/>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.card}>
          <Text>Login</Text>
        </TouchableOpacity>
       </Link>
      
      <Spacer />

     <Link href="/register" asChild>
        <TouchableOpacity style={styles.card}>
          <Text>Register</Text>
        </TouchableOpacity>
       </Link>

        <Link href="/gymCapacity" asChild>
        <TouchableOpacity style={styles.card}>
          <Text>Check capacity</Text>
        </TouchableOpacity>
       </Link>
        <Image source={Logo} style={styles.img}/> 

    </ThemedView>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    title: {
        fontWeight: 'bold',
        fontSize: 18 
    },

    card: {
        backgroundColor: '#eee',
        padding: 20,
        borderRadius: 5,
        boxShadow:'4px 4px rgba(0,0,0,0.1)',
    },

    img: {
        marginVertical: 30
    }
})
