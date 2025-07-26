import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import { useThemeContext } from "../../components/themedContext";

import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

const Profile = () => {
  const router = useRouter();

  const [userData, setUserData] = useState({
    name: "Loading...",
    bio: "No bio yet.",
    height: null,
    weight: null,
    age: null,
    profilePicUrl: null,
  });

  const [modalVisible, setModalVisible] = useState(false);

  const { theme, toggleTheme } = useThemeContext();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            name: data.name || "Unknown",
            bio: data.bio || "No bio yet.",
            height: data.height || null,
            weight: data.weight || null,
            age: data.age || null,
            profilePicUrl: data.profilePicUrl || null,
          });
        } else {
          setUserData((prev) => ({ ...prev, name: "No user data" }));
        }
      },
      (error) => {
        console.error("Error listening to user data:", error);
        setUserData((prev) => ({ ...prev, name: "Error loading data" }));
      },
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout.");
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        onPress={toggleTheme}
        style={styles.themeToggleBtn}
        testID="theme-toggle-button"
      >
        <MaterialCommunityIcons
          name="theme-light-dark"
          size={28}
          color={theme === "light" ? "#f5e900" : "#fff"}
        />
      </TouchableOpacity>

      <ThemedText style={styles.title} title>
        Your Profile
      </ThemedText>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        style={styles.profileIconWrapper}
        testID="avatar-icon"
      >
        {userData.profilePicUrl ? (
          <Image
            source={{ uri: userData.profilePicUrl }}
            style={styles.profilePic}
          />
        ) : (
          <MaterialIcons name="account-circle" size={80} color="#ccc" />
        )}
      </TouchableOpacity>

      <ThemedText style={styles.userName}>{userData.name}</ThemedText>

      <Spacer />

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Bio</ThemedText>
        <ThemedText style={{ color: "white" }}>{userData.bio}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Stats</ThemedText>
        <ThemedText style={{ color: "white" }}>
          Height: {userData.height ? `${userData.height} cm` : "Not set"}
        </ThemedText>
        <ThemedText style={{ color: "white" }}>
          Weight: {userData.weight ? `${userData.weight} kg` : "Not set"}
        </ThemedText>
        <ThemedText style={{ color: "white" }}>
          Age: {userData.age ? `${userData.age}` : "Not set"}
        </ThemedText>
      </View>

      <View style={styles.buttonRow}>
        <ThemedButton onPress={() => router.push("/editProfile")}>
          <ThemedText style={{ color: "white" }}>Edit</ThemedText>
        </ThemedButton>

        <View style={{ width: 10 }} />

        <ThemedButton
          onPress={handleLogout}
          style={{ backgroundColor: "#2196f3" }}
        >
          <ThemedText style={{ color: "white" }}>Logout</ThemedText>
        </ThemedButton>
      </View>

      {/* Modal to show large profile pic */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
          testID="modal-overlay"
        >
          <View style={styles.modalContent} testID="profile-modal">
            {userData.profilePicUrl ? (
              <View style={styles.largeProfilePicWrapper}>
                <Image
                  source={{ uri: userData.profilePicUrl }}
                  style={styles.largeProfilePic}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <MaterialIcons name="account-circle" size={200} color="#ccc" />
            )}
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 70,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  profileIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "grey",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "purple",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 5,
    color: "white",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 12,
  },

  largeProfilePic: {
    width: 250,
    height: 250,
    borderRadius: 125,
  },

  themeToggleBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#2196f3",
    zIndex: 10,
  },
});
