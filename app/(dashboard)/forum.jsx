import {StyleSheet} from 'react-native'

import ThemedText from '../../components/themedText'
import ThemedView from '../../components/themedView'

const forum = () => {
  
  return (
    <ThemedView style={styles.container}>
      
      <ThemedText style={styles.title} title={true}>Forum</ThemedText>
      
    </ThemedView>
  )
}

export default forum

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
})