import { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  View,
} from "react-native";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const ProfileIconPage = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("Loading...");
  const [editMode, setEditMode] = useState(false);
  const [inputName, setInputName] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const name = docSnap.data().name || "Unknown";
            setUserName(name);
            setInputName(name);
          } else {
            setUserName("No user data");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserName("Error");
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, { name: inputName });
        setUserName(inputName);
        setEditMode(false);
        console.log("Username updated to:", inputName);
      }
    } catch (error) {
      console.error("Error saving user name:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      await signOut(auth);
      console.log("User signed out:", user?.uid);
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Profile
      </ThemedText>

      <Spacer />

      <TouchableOpacity style={styles.iconContainer}>
        <MaterialIcons name="account-circle" size={80} color="#f2f2f2" />
      </TouchableOpacity>

      <Spacer />

      {editMode ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputName}
            onChangeText={setInputName}
            placeholder="Enter new name"
          />
          <ThemedButton onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </ThemedButton>
        </View>
      ) : (
        <ThemedText style={styles.username}>{userName}</ThemedText>
      )}

      <Spacer />

      <ThemedButton
        style={styles.editButton}
        onPress={() => setEditMode(!editMode)}
      >
        <MaterialIcons name="edit" size={24} color="#f2f2f2" />
        <ThemedText style={styles.buttonText}>
          {editMode ? "Cancel" : "Edit Profile"}
        </ThemedText>
      </ThemedButton>

      <ThemedButton onPress={handleLogout}>
        <Text style={{ color: "#f2f2f2", fontWeight: "bold" }}>Logout</Text>
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

  username: {
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 10,
  },

  inputContainer: {
    width: "80%",
    alignItems: "center",
  },

  input: {
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
  },

  saveButton: {
    backgroundColor: "#2a9d8f",
    padding: 10,
    borderRadius: 6,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
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

  logoutButton: {
    top: 40,
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#333",
    borderRadius: 6,
    zIndex: 10,
  },
});
