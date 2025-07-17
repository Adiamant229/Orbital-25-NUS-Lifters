//react and expo imports
import { useEffect, useState, useRef } from "react";
import {
  Alert,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import uuid from "react-native-uuid";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

//firebase imports
import { getAuth } from "firebase/auth";
import {
  addDoc,
  updateDoc,
  getDoc,
  doc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../firebaseConfig";

//thenmed components
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import ThemedTextInput from "../../components/themedTextInput";
import ThemedButton from "../../components/themedButton";

const categories = ["Training", "Diet", "Cardio"];

const AddEditThread = () => {
  const { threadId } = useLocalSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [originalMediaUrl, setOriginalMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!threadId;

  const videoRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    const fetchThread = async () => {
      const docRef = doc(db, "threads", threadId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title);
        setCategory(data.category);
        setContent(data.content);
        setMediaUri(data.mediaUrl || null);
        setMediaType(data.mediaType || null);
        setOriginalMediaUrl(data.mediaUrl || null);
      }
    };
    fetchThread();
  }, [threadId]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      videoRef.current?.setPositionAsync(0);
      videoRef.current?.pauseAsync();
    }
  };

  const handlePickMedia = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Media access is needed.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const picked = result.assets[0];
        setMediaUri(picked.uri);
        setMediaType(picked.type);
      }
    } catch (error) {
      console.error("Error in handlePickMedia:", error);
      Alert.alert("Error", "An error occurred while picking media.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera access is needed.");
        return;
      }

      Alert.alert(
        "Choose Capture Type",
        "Do you want to take a photo or a video?",
        [
          {
            text: "Photo",
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                quality: 0.7,
                allowsEditing: false,
              });
              if (!result.canceled && result.assets?.length > 0) {
                setMediaUri(result.assets[0].uri);
                setMediaType(result.assets[0].type);
              }
            },
          },
          {
            text: "Video",
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["videos"],
                quality: 0.7,
                allowsEditing: false,
              });
              if (!result.canceled && result.assets?.length > 0) {
                setMediaUri(result.assets[0].uri);
                setMediaType(result.assets[0].type);
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Error in handleTakePhoto:", error);
      Alert.alert("Error", "An error occurred while accessing the camera.");
    }
  };

  const uploadMedia = async () => {
    if (!mediaUri) return null;
    const response = await fetch(mediaUri);
    const blob = await response.blob();
    const ext = mediaType === "video" ? ".mp4" : ".jpg";
    const fileRef = ref(storage, `threadMedia/${uuid.v4()}${ext}`);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const deleteMediaFromStorage = async (mediaUrl) => {
    if (!mediaUrl) return;
    try {
      const baseUrl = mediaUrl.split("?")[0];
      const pathEncoded = baseUrl.split("/o/")[1];
      const path = decodeURIComponent(pathEncoded);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Failed to delete old media from storage:", err);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing Fields", "Title and content are required.");
      return;
    }

    Alert.alert(
      isEdit ? "Save Changes?" : "Create Thread?",
      isEdit
        ? "Do you want to save changes to this thread?"
        : "Do you want to post this new thread?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setLoading(true);
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) throw new Error("User not logged in");

              if (isEdit && originalMediaUrl) {
                const isMediaRemoved = !mediaUri;
                const isMediaReplaced =
                  mediaUri && mediaUri !== originalMediaUrl;
                if (isMediaRemoved || isMediaReplaced) {
                  await deleteMediaFromStorage(originalMediaUrl);
                  setOriginalMediaUrl(null);
                }
              }

              const mediaUrl = await uploadMedia();

              if (isEdit) {
                await updateDoc(doc(db, "threads", threadId), {
                  title,
                  category,
                  content,
                  mediaUrl: mediaUrl || mediaUri || null,
                  mediaType: mediaType || null,
                  updatedAt: serverTimestamp(),
                });
                Alert.alert("Success", "Thread updated.");
              } else {
                await addDoc(collection(db, "threads"), {
                  title,
                  category,
                  content,
                  authorId: user.uid,
                  mediaUrl: mediaUrl || null,
                  mediaType: mediaType || null,
                  createdAt: serverTimestamp(),
                  likes: 0,
                  likedBy: [],
                });
                Alert.alert("Success", "Thread created.");
              }

              router.back();
            } catch (e) {
              console.error("Error submitting thread:", e);
              Alert.alert("Error", "Could not submit thread.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (title || content || mediaUri) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText title style={styles.title}>
        {isEdit ? "Edit Thread" : "Create New Thread"}
      </ThemedText>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedTextInput
          placeholder="Thread Title"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="grey"
        />

        <ThemedText style={styles.categoryLabel}>Select Category:</ThemedText>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <ThemedButton
              key={cat}
              style={[
                styles.categoryButton,
                { backgroundColor: category === cat ? "#7d015c" : "#2196f3" },
              ]}
              onPress={() => setCategory(cat)}
            >
              <ThemedText style={styles.categoryButtonText}>{cat}</ThemedText>
            </ThemedButton>
          ))}
        </View>

        <ThemedTextInput
          placeholder="Thread content..."
          multiline
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholderTextColor="grey"
        />

        <ThemedText style={styles.mediaLabel}>
          Attach Media (optional):
        </ThemedText>
        <View style={styles.mediaButtonContainer}>
          <ThemedButton onPress={handlePickMedia}>
            <ThemedText style={styles.mediaButtonText}>
              Pick from Gallery
            </ThemedText>
          </ThemedButton>
          <ThemedButton testID="take-photo-button" onPress={handleTakePhoto}>
            <ThemedText style={styles.mediaButtonText}>
              Take Photo/Video
            </ThemedText>
          </ThemedButton>
        </View>

        {mediaUri && (
          <>
            {mediaType === "image" ? (
              <Image
                source={{ uri: mediaUri }}
                style={styles.mediaPreview}
                resizeMode="contain"
                testID="thread-image"
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: mediaUri }}
                useNativeControls
                resizeMode="contain"
                style={styles.mediaPreview}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                testID="thread-video"
              />
            )}

            <TouchableOpacity
              testID="remove-media-button"
              onPress={() => setMediaUri(null)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.buttonRow}>
          <ThemedButton
            onPress={handleSubmit}
            style={{ flex: 1 }}
          >
            <ThemedText style={styles.submitText}>
              {loading ? "Saving..." : isEdit ? "Save" : "Create"}
            </ThemedText>
          </ThemedButton>
          <ThemedButton
            onPress={handleCancel}
            style={{ flex: 1, backgroundColor: "grey" }}
          >
            <ThemedText style={styles.submitText}>Cancel</ThemedText>
          </ThemedButton>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default AddEditThread;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 10 },
  title: { fontSize: 20 },
  scrollContent: { paddingBottom: 40 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
    padding: 10,
    width: "100%",
  },
  categoryLabel: { fontWeight: "bold", marginTop: 10 },
  categoryContainer: {
    flexDirection: "row",
    gap: 7,
  },
  categoryButton: {
    borderRadius: 20,
    height: 30,
    paddingVertical: 4,
    justifyContent: "center",
  },
  categoryButtonText: { color: "white" },
  contentInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    textAlignVertical: "top",
    width: "100%",
  },
  mediaLabel: { marginTop: 20 },
  mediaButtonContainer: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 10,
  },
  mediaButtonText: { color: "white" },
  mediaPreview: { height: 150, marginTop: 10 },
  buttonRow: { flexDirection: "row", marginTop: 30, gap: 10 },
  submitText: { color: "#fff", textAlign: "center" },
});
