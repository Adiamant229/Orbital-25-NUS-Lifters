//react and expo imports 
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

//firebase imports 
import { auth, db, storage } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

//themed components 
import ThemedText from "../../components/themedText";
import ThemedTextInput from "../../components/themedTextInput";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";

const EditProfile = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [profilePicUri, setProfilePicUri] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setBio(data.bio || "");
          setHeight(
            data.height !== undefined && data.height !== null
              ? data.height.toString()
              : "",
          );
          setWeight(
            data.weight !== undefined && data.weight !== null
              ? data.weight.toString()
              : "",
          );
          setAge(
            data.age !== undefined && data.age !== null
              ? data.age.toString()
              : "",
          );
          setProfilePicUrl(data.profilePicUrl || null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const uploadImageAsync = async (uri) => {
    setUploadingImage(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Upload failed", error);
      Alert.alert("Upload Error", "Failed to upload profile picture.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Pick from library
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Allow access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setProfilePicUri(localUri);

      const url = await uploadImageAsync(localUri);
      if (url) setProfilePicUrl(url);
    }
    setModalVisible(false);
  };

  // Take a photo
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Allow access to camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setProfilePicUri(localUri);

      const url = await uploadImageAsync(localUri);
      if (url) setProfilePicUrl(url);
    }
    setModalVisible(false);
  };

  // Delete profile picture
  const deletePhoto = () => {
    Alert.alert(
      "Delete Profile Picture",
      "Are you sure you want to delete your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setProfilePicUri(null);
            setProfilePicUrl(null);
            setModalVisible(false);
          },
        },
      ],
    );
  };

  const handleSave = () => {
    if (name.trim() === "") {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    if (height && isNaN(Number(height))) {
      Alert.alert("Validation Error", "Height must be a number.");
      return;
    }
    if (weight && isNaN(Number(weight))) {
      Alert.alert("Validation Error", "Weight must be a number.");
      return;
    }
    if (age && isNaN(Number(age))) {
      Alert.alert("Validation Error", "Age must be a number.");
      return;
    }

    Alert.alert(
      "Confirm Save",
      "Save changes to your profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async () => {
            setSaving(true);
            try {
              const user = auth.currentUser;
              if (!user) throw new Error("User not authenticated");

              const docRef = doc(db, "users", user.uid);
              await updateDoc(docRef, {
                name: name.trim(),
                bio: bio.trim(),
                height: height ? Number(height) : null,
                weight: weight ? Number(weight) : null,
                age: age ? Number(age) : null,
                profilePicUrl: profilePicUrl || null,
              });

              Alert.alert("Success", "Profile updated!");
              router.back();
            } catch (error) {
              console.error("Save failed", error);
              Alert.alert("Error", "Failed to save profile.");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to cancel? Unsaved changes will be lost.",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", style: "destructive", onPress: () => router.back() },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <ThemedText style={styles.title} title>
            Edit Profile
          </ThemedText>

          <Spacer />

          <View style={styles.profileIconWrapper}>
            {uploadingImage ? (
              <ActivityIndicator size="large" color="#666" />
            ) : profilePicUri || profilePicUrl ? (
              <Image
                source={{ uri: profilePicUri || profilePicUrl }}
                style={styles.profilePic}
              />
            ) : (
              <MaterialIcons name="account-circle" size={80} color="#ccc" />
            )}

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.editIconOnAvatar}
              testID="uploadPhotoButton"
            >
              <MaterialIcons name="camera-alt" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Spacer />
          <Spacer />

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Name:</ThemedText>
            <ThemedTextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderColor="grey"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bio:</ThemedText>
            <ThemedTextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Write your bio"
              multiline
              numberOfLines={3}
              placeholderTextColor="grey"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Height (cm):</ThemedText>
            <ThemedTextInput
              value={height}
              onChangeText={setHeight}
              placeholder="Height (cm)"
              keyboardType="numeric"
              placeholderTextColor="grey"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Weight (kg):</ThemedText>
            <ThemedTextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight (kg)"
              keyboardType="numeric"
              placeholderTextColor="grey"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Age (years):</ThemedText>
            <ThemedTextInput
              value={age}
              onChangeText={setAge}
              placeholder="Age (years)"
              keyboardType="numeric"
              placeholderTextColor="grey"
              style={styles.input}
            />
          </View>

          <Spacer />

          <Spacer />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <ThemedButton
              onPress={handleSave}
              disabled={saving || uploadingImage}
              style={{ flex: 1 }}
            >
              <ThemedText>{saving ? "Saving..." : "Save"}</ThemedText>
            </ThemedButton>

            <ThemedButton onPress={handleCancel} style={{ flex: 1 }}>
              <ThemedText>Cancel</ThemedText>
            </ThemedButton>
          </View>
        </ScrollView>

        {/* Modal for camera/gallery/delete options */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={pickImage} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Choose from Library</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </TouchableOpacity>
              {(profilePicUri || profilePicUrl) && (
                <TouchableOpacity
                  onPress={deletePhoto}
                  style={styles.modalButton}
                  testID="deletePhotoButton"
                >
                  <Text style={[styles.modalButtonText, { color: "red" }]}>
                    Delete Photo
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  scrollViewContent: { alignItems: "center", paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "bold" },
  profileIconWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 50,
    overflow: "visible",
  },
  profilePic: { width: 80, height: 80, borderRadius: 40 },
  editIconOnAvatar: {
    position: "absolute",
    bottom: -6,
    right: -10,
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 2,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 20,
    width: 250,
    alignItems: "center",
  },
  modalButton: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 12,
  },

  label: {
    fontWeight: "600",
    marginBottom: 4,
    alignSelf: "flex-start",
  },

  input: {
    width: "100%",
  },
});
