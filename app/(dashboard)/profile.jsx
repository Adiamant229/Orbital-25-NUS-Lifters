import { StyleSheet, TouchableOpacity, View } from "react-native";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import { MaterialIcons } from "@expo/vector-icons";

const ProfileIconPage = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Profile
      </ThemedText>

      <Spacer />

      {/* Profile Icon (MaterialIcon) */}
      <TouchableOpacity style={styles.iconContainer}>
        <MaterialIcons name="account-circle" size={80} color="#f2f2f2" />
      </TouchableOpacity>

      <Spacer />

      {/* Username */}
      <ThemedText style={styles.username}>John Doe</ThemedText>

      <Spacer />

      {/* Edit Button */}
      <ThemedButton style={styles.editButton}>
        <MaterialIcons name="edit" size={24} color="#f2f2f2" />
        <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
      </ThemedButton>
    </ThemedView>
  );
};

export default ProfileIconPage;

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

  iconContainer: {
    borderWidth: 2,
    borderColor: "#f2f2f2",
    borderRadius: 50,
    padding: 5,
    overflow: "hidden",
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes the image circular
    resizeMode: "cover",
  },

  username: {
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 10,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 12,
    backgroundColor: "#2a9d8f",
    borderRadius: 6,
    width: "80%",
    justifyContent: "center",
  },

  buttonText: {
    color: "#f2f2f2",
    fontSize: 16,
    marginLeft: 10,
  },
});
