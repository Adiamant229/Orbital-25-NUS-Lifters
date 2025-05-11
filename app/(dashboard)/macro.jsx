import { StyleSheet, Text, View } from 'react-native'

import ThemedText from '../../components/themedText'
import ThemedView from '../../components/themedView'
import Spacer from '../../components/spacer'
import ThemedButton from '../../components/themedButton'
import { MaterialIcons } from '@expo/vector-icons'

const Macro = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>Macro Calculator</ThemedText>

      <Spacer />

      <ThemedButton style={styles.searchButton}>
        <View style={styles.searchContent}>
          <MaterialIcons size={24} name="search" color="#f2f2f2" />
          <Text style={styles.buttonText}>Search Food</Text>
        </View>
      </ThemedButton>

      <Spacer />

      <View style={styles.infoBox}>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>Egg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Protein:</Text>
          <Text style={styles.value}>6g</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fat:</Text>
          <Text style={styles.value}>5g</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Carbs:</Text>
          <Text style={styles.value}>0.6g</Text>
        </View>
      </View>
    </ThemedView>
  )
}

export default Macro

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

  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  buttonText: {
    color: '#f2f2f2',
    fontSize: 16,
    fontWeight: '600',
  },

  infoBox: {
    width: '100%',
    marginTop: 30,
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },

  label: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  value: {
    fontSize: 16,
  },
})
