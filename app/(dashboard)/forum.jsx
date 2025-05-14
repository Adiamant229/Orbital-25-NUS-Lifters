import { StyleSheet, Text, SafeAreaView } from "react-native";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";

const Forum = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <ThemedText style={styles.title} title={true}>
          Latest Discussions
        </ThemedText>

        <Spacer />

        <ThemedView style={styles.buttonContainer}>
          <ThemedButton style={styles.button}>
            <MaterialIcons size={40} name="fitness-center" />
            <Link href="/forum/training">
              <Text style={styles.buttonText}>Training</Text>
            </Link>
          </ThemedButton>

          <ThemedButton style={styles.button}>
            <MaterialIcons size={40} name="restaurant" />
            <Link href="/forum/diet">
              <Text style={styles.buttonText}>Diet</Text>
            </Link>
          </ThemedButton>

          <ThemedButton style={styles.button}>
            <FontAwesome size={40} name="heartbeat" />
            <Link href="/forum/nutrition">
              <Text style={styles.buttonText}>Cardio</Text>
            </Link>
          </ThemedButton>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
};

export default Forum;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  innerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
    marginTop: 20, // Added margin to push the title lower
  },

  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 20, // spacing between buttons
  },

  button: {
    width: "100%",
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#f2f2f2",
    fontSize: 16,
    fontWeight: "600",
  },
});
