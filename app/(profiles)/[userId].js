import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import Spacer from "../../components/spacer";
import { MaterialIcons } from "@expo/vector-icons";

const PublicProfile = () => {
  const { userId } = useLocalSearchParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setProfileData(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setProfileData(userSnap.data());
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error("Error fetching user doc:", error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!profileData)
    return (
      <ThemedView style={styles.container}>
        <ThemedText>User not found</ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={styles.container}>
        
      {/* Pressable for opening modal */}
      <TouchableOpacity
        style={styles.profileIconWrapper}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        {profileData.profilePicUrl ? (
          <Image
            source={{ uri: profileData.profilePicUrl }}
            style={styles.profilePic}
          />
        ) : (
          <MaterialIcons name="account-circle" size={100} color="#ccc" />
        )}
      </TouchableOpacity>

      <Spacer height={15} />

      <ThemedText style={styles.name} title>
        {profileData.name || "No Name"}
      </ThemedText>

      <Spacer height={10} />

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Bio</ThemedText>
        <ThemedText>{profileData.bio || "No bio available."}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Stats</ThemedText>
        <ThemedText>
          Height: {profileData.height ? `${profileData.height} cm` : "Not set"}
        </ThemedText>
        <ThemedText>
          Weight: {profileData.weight ? `${profileData.weight} kg` : "Not set"}
        </ThemedText>
        <ThemedText>
          Age: {profileData.age ? `${profileData.age}` : "Not set"}
        </ThemedText>
      </View>

      {/* Modal for large profile pic */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {profileData.profilePicUrl ? (
              <View style={styles.largeProfilePicWrapper}>
                <Image
                  source={{ uri: profileData.profilePicUrl }}
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

export default PublicProfile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 80,
    alignItems: "center",
    flex: 1,
  },
  profileIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
  },
  section: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "purple",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  textMuted: {
    fontSize: 14,
    color: "#777",
    marginTop: 30,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
  },
  largeProfilePicWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
  },
  largeProfilePic: {
    width: "100%",
    height: "100%",
  },
});
