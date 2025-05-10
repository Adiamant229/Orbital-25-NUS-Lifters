import { StyleSheet, Pressable, Text } from 'react-native'
import { Link } from 'expo-router'
import { Colors } from '../../constants/colors'

//themed components
import ThemedView from '../../components/themedView'
import ThemedText from '../../components/themedText'
import ThemedButton from '../../components/themedButton'
import Spacer from '../../components/spacer'

const login = () => {
    const handleSubmit = () => {
        console.log('login form submitted')
    }
  return (
    <ThemedView style={styles.container}>

        <Spacer />

        <ThemedText title={true} style={styles.title}> 
            Login to Your Account
        </ThemedText>

        <ThemedButton onPress={handleSubmit}> 
            <Text style={{ color: '#f2f2f2'}}>Login</Text>
        </ThemedButton>

        <Spacer height={100} />

        <Link href='/register'>
        <ThemedText style={{ textAlign: 'center' }}>Register instead</ThemedText>
        </Link>

    </ThemedView>
  )
}

export default login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    title: {
        textAlign: 'center',
        fontSize: 18,
        marginBottom: 30
    },

    btn: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 5,
    },

    pressed: {
        opacity: 0.8
    }
})