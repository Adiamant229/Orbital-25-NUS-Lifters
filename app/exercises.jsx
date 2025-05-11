import { StyleSheet, Image, View } from 'react-native'

import ThemedText from '../components/themedText'
import ThemedView from '../components/themedView'
import Spacer from '../components/spacer'

const exercises = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>Exercises</ThemedText>

      <Spacer />

      {/* Placeholder for bench press image */}
      <Image
        source={require('../assets/bench-press-800.jpg')} // Replace with your image path
        style={styles.image}
      />

      <Spacer />

      {/* Exercise Card */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Bench Press</ThemedText>
        <ThemedText style={styles.cardDescription}>
          The bench press is a weight training exercise in which the individual presses a weight upwards while lying on a bench. It primarily targets the chest, shoulders, and triceps.
        </ThemedText>
      </View>
    </ThemedView>
  )
}

export default exercises

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 20,
  },

  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain', // Makes sure the image is scaled to fit
    borderRadius: 10,
  },

  card: {
    width: '100%',
    padding: 20,
    backgroundColor: '#eee',
    marginTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },

  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },

  cardDescription: {
    fontSize: 16,
  
  },
})
