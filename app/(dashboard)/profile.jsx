// react and expo imports
import { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  View,
} from "react-native";

// themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// firebase imports
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const Profile = () => {
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

  const handleCancel = () => {
    setInputName(userName);
    setEditMode(false);
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

      <View style={styles.profileIconWrapper}>
        <MaterialIcons name="account-circle" size={80} color="#f2f2f2" />
        {!editMode && (
          <TouchableOpacity
            onPress={() => setEditMode(true)}
            style={styles.editIconOnAvatar}
          >
            <MaterialIcons name="edit" size={20} color="#f2f2f2" />
          </TouchableOpacity>
        )}
      </View>

      <Spacer />

      <View style={styles.usernameContainer}>
        {editMode ? (
          <View style={styles.inputWithIcons}>
            <TextInput
              style={styles.input}
              value={inputName}
              onChangeText={setInputName}
              placeholder="Enter new name"
            />
            <View style={styles.editIconsRow}>
              <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
                <MaterialIcons name="check" size={22} color="#2a9d8f" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.iconButton}
              >
                <MaterialIcons name="close" size={22} color="#e76f51" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.username}>{userName}</Text>
        )}
      </View>

      <Spacer />

      <ThemedButton onPress={handleLogout}>
        <Text style={{ color: "#f2f2f2", fontWeight: "bold" }}>Logout</Text>
      </ThemedButton>
    </ThemedView>
  );
};

export default Profile;

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

  profileIconWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f2f2f2",
    borderRadius: 50,
    overflow: "visible", // <- allow pen icon to overflow outside container if needed
    backgroundColor: "transparent", // just in case
  },

  editIconOnAvatar: {
    position: "absolute",
    bottom: -6, // moved a bit down, adjust as needed
    right: -10, // moved more to the right, adjust as needed
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 2,
    zIndex: 9999, // super high to ensure on top
    elevation: 9999, // Android layering
  },

  usernameContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  username: {
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
  },

  inputWithIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    minWidth: 200,
  },

  editIconsRow: {
    flexDirection: "row",
    marginLeft: 8,
  },

  iconButton: {
    marginHorizontal: 4,
  },
});
