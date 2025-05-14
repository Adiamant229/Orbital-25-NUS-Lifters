import React, { useState } from "react"; // Import React and useState
import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";

const WeightTracker = () => {
  // State to track the weight lifted
  const [weight, setWeight] = useState("");

  // Function to handle the button press
  const handleSubmit = () => {
    console.log(`You lifted ${weight} kg today!`);
    // You can also save the data or handle it further here
    setWeight(""); // Reset the input after submitting
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Track Your Weights
      </ThemedText>

      <Spacer />

      {/* Input for the weight lifted */}
      <ThemedText style={styles.inputLabel}>
        Enter Weight Lifted (kg):
      </ThemedText>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="Enter weight"
      />

      <Spacer />

      {/* Submit button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default WeightTracker;

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

  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
    width: "100%",
  },

  submitButton: {
    paddingVertical: 12,
    backgroundColor: "#2a9d8f",
    borderRadius: 6,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  submitButtonText: {
    color: "#f2f2f2",
    fontSize: 16,
    fontWeight: "600",
  },
});
