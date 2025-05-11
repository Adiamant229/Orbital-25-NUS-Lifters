import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'

import ThemedText from '../../components/themedText'
import ThemedView from '../../components/themedView'
import Spacer from '../../components/spacer'
import ThemedButton from '../../components/themedButton'
import { MaterialIcons } from '@expo/vector-icons/'
import { Link } from 'expo-router'


const gymCapacity = () => {
  
  return (
    <ThemedView style={styles.container}>
      
      <ThemedText style={styles.title} title={true}>Gym Traffic (as of 110525 1100am) </ThemedText>
      
      <Spacer /> 
      
      <ThemedView style={styles.buttonContainer}>
        <ThemedButton style={styles.button}>
          <Link href="/gymReports">
            <Text style={{ color: '#f2f2f2' }}>UTown Gym: 75%</Text>
            </Link>
            <Spacer/>
             <MaterialIcons 
                    size={50} 
                    name= "groups"
                    
                    />
        </ThemedButton>

        <ThemedButton style={styles.button}>
                        <Text style={{ color: '#f2f2f2' }}>MPSH Gym: 25%</Text>
            <Spacer/>
             <MaterialIcons 
                    size={50} 
                    name= "groups"
                    
                    />
        </ThemedButton>
      </ThemedView>

    </ThemedView>
  )
}

export default gymCapacity

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },

    title: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 20
    },

    buttonContainer: {
        flexDirection: 'row',  // This arranges buttons side by side
        width: '100%',         // Full container width
        justifyContent: 'space-between',  // Space between buttons
    },

    button: {
        width: '48%',          // Increase width to make the buttons wider (48% of container width)
        marginHorizontal: 6,   // Space between buttons
        paddingVertical: 80,   // Make the buttons bigger
        alignItems: 'center',  // Center text horizontally
        justifyContent: 'center',  // Center text vertically
    }
})
