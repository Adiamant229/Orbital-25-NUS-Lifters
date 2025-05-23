import { StyleSheet, TouchableOpacity, Text, View } from "react-native";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import { MaterialIcons } from "@expo/vector-icons/";
import { Link, useRouter } from "expo-router";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";

const gymCapacity = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); // Redirect after logout, adjust path if needed
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      
      {/* Logout button at top center */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={{ color: "#f2f2f2", fontWeight: "bold" }}>Logout</Text>
      </TouchableOpacity>

      <ThemedText style={styles.title} title={true}>
        Gym Traffic (as of 110525 1100am){" "}
      </ThemedText>

      <Spacer />

      <ThemedView style={styles.buttonContainer}>
        <ThemedButton style={styles.button}>
          <Link href="/gymReports">
            <Text style={{ color: "#f2f2f2" }}>UTown Gym: 75%</Text>
          </Link>
          <Spacer />
          <MaterialIcons size={50} name="groups" />
        </ThemedButton>

        <ThemedButton style={styles.button}>
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

  logoutButton: {
    position: "absolute",
    top: 40, // Adjust as needed for status bar
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#333",
    borderRadius: 6,
    zIndex: 10,
  },

  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
  },

  buttonContainer: {
    flexDirection: "row", // This arranges buttons side by side
    width: "100%", // Full container width
    justifyContent: "space-between", // Space between buttons
  },

  button: {
    width: "48%", // Increase width to make the buttons wider (48% of container width)
    marginHorizontal: 6, // Space between buttons
    paddingVertical: 80, // Make the buttons bigger
    alignItems: "center", // Center text horizontally
    justifyContent: "center", // Center text vertically
  },
});
