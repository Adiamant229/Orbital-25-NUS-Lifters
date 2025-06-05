//react and expo imports 
import { StyleSheet, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons/";
import { Link, useRouter } from "expo-router";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";

const gymCapacity = () => {
    const router = useRouter(); 
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Gym Traffic (as of 110525 1100am){" "}
      </ThemedText>

      <Spacer />

      <ThemedView style={styles.buttonContainer}>
        <ThemedButton
          style={styles.button}
          onPress={() => router.push("/utownReports")}
        >
          <ThemedText>UTown Gym: 75%</ThemedText>
          <Spacer />
          <MaterialIcons size={50} name="groups" />
        </ThemedButton>

        <ThemedButton
          style={styles.button}
          onPress={() => router.push("/mpshReports")}
        >
          <Text style={{ color: "#f2f2f2" }}>MPSH Gym: 25%</Text>
          <Spacer />
          <MaterialIcons size={50} name="groups" />
        </ThemedButton>
      </ThemedView>
    </ThemedView>
  );
};

export default gymCapacity;

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

  buttonContainer: {
    flexDirection: "row", 
    width: "100%", 
    justifyContent: "space-between", 
  },

  button: {
    width: "48%", 
    marginHorizontal: 6, 
    paddingVertical: 80, 
    alignItems: "center", 
    justifyContent: "center",
  },
});
