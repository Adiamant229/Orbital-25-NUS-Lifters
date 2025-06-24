// react and expo imports
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// themed components
import ThemedText from "../../components/themedText";
import ThemedTextInput from "../../components/themedTextInput";
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

  const [saving, setSaving] = useState(false);

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

  const handleSave = () => {
    if (inputName.trim() === "") {
      Alert.alert("Error", "Please enter a new name.");
      return;
    }

    Alert.alert("Save Name", "Are you sure you want to update your name?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        onPress: async () => {
          setSaving(true);
          try {
            const user = auth.currentUser;
            if (user) {
              const docRef = doc(db, "users", user.uid);
              await updateDoc(docRef, { name: inputName });
              setUserName(inputName);
              setEditMode(false);
            }
          } catch (error) {
            console.error("Error saving user name:", error);
            Alert.alert("Error", "Failed to save your name. Please try again.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    setInputName(userName);
    setEditMode(false);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const user = auth.currentUser;
            await signOut(auth);
            console.log("User signed out:", user?.uid);
            router.replace("/");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
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
            testID="editButton"
          >
            <MaterialIcons name="edit" size={20} color="#f2f2f2" />
          </TouchableOpacity>
        )}
      </View>

      <Spacer />

      <View style={styles.usernameContainer}>
        {editMode ? (
          <View style={styles.inputWithIcons}>
            <ThemedTextInput
              value={inputName}
              onChangeText={setInputName}
              placeholder="Enter new name"
            />
            <View style={styles.editIconsRow}>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.iconButton}
                disabled={saving}
                testID="saveButton"
              >
                <MaterialIcons
                  name="check"
                  size={22}
                  color={saving ? "grey" : "#2a9d8f"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.iconButton}
                testID="cancelButton"
              >
                <MaterialIcons name="close" size={22} color="#e76f51" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ThemedText>{userName}</ThemedText>
        )}
      </View>

      <Spacer />

      <ThemedButton onPress={handleLogout}>
        <ThemedText>Logout</ThemedText>
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
    overflow: "visible", 
    backgroundColor: "transparent", 
  },

  editIconOnAvatar: {
    position: "absolute",
    bottom: -6, 
    right: -10, 
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 2,
    zIndex: 9999, 
    elevation: 9999, 
  },

  usernameContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  inputWithIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  editIconsRow: {
    flexDirection: "row",
    marginLeft: 8,
  },

  iconButton: {
    marginHorizontal: 4,
  },
});
