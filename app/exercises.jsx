//react imports
import { StyleSheet, Image } from "react-native";

//themed components 
import ThemedText from "../components/themedText";
import ThemedView from "../components/themedView";
import ThemedCard from "../components/themedCard";
import Spacer from "../components/spacer";

const exercises = () => {

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Chest Exercises
      </ThemedText>

      <Spacer />

      <Image
        source={require("../assets/img/bench-press-800.jpg")}
        style={styles.image}
      />

      <Spacer />

      <ThemedCard style={{width: '100%', minHeight: 80}}>
        <ThemedText style={styles.cardTitle}>Bench Press</ThemedText>
        <ThemedText style={styles.cardDescription}>
          The bench press is a weight training exercise in which the individual
          presses a weight upwards while lying on a bench. It primarily targets
          the chest, shoulders, and triceps.
        </ThemedText>
      </ThemedCard>
    </ThemedView>
  );
};

export default exercises;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    borderRadius: 10,
  },

  cardTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },

  cardDescription: {
    fontSize: 12,
  },
});
