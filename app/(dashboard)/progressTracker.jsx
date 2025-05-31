//react and expo imports 
import { useState } from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";

//themed components
import ThemedText from "../../components/themedText";
import ThemedTextInput from "../../components/themedTextInput";
import ThemedButton from "../../components/themedButton";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";


const progressTracker = () => {
  const [weight, setWeight] = useState("");

  const handleSubmit = () => {
    console.log(`You lifted ${weight} kg today!`);
    setWeight("");
  };

  const router = useRouter(); 

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Track Your Weights
      </ThemedText>

      <Spacer />

      <ThemedText style={styles.inputLabel}>
        Enter Weight Lifted (kg):
      </ThemedText>

      <ThemedTextInput
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="Enter weight"
      />

      <Spacer />

      <ThemedButton onPress={handleSubmit}>
        <ThemedText>Submit</ThemedText>
      </ThemedButton>

      <ThemedButton onPress={() => router.push('/exercises')}>
        <ThemedText>Gym Info and Guide</ThemedText>
      </ThemedButton>
    </ThemedView>
  );
};

export default progressTracker;

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

  inputLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
});
