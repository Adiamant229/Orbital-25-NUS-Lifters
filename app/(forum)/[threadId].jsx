//react and expo imports
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Alert,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

//firebase imports
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

//themed components
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";

const ThreadDetailPage = () => {
  const { threadId } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef(null);

  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  const [commentSort, setCommentSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [originalContent, setOriginalContent] = useState("");

  const [zoomImageModalVisible, setZoomImageModalVisible] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) setCurrentUserId(user.uid);

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const names = {};
      snapshot.forEach((doc) => {
        names[doc.id] = doc.data().name || "Anonymous";
      });
      setUserNames(names);
    });

    const threadRef = doc(db, "threads", threadId);
    const unsubThread = onSnapshot(threadRef, (snap) => {
      if (snap.exists()) {
        setThread({ id: snap.id, ...snap.data() });
      } else {
        Alert.alert("Thread not found");
        router.back();
      }
    });

    const unsubComments = onSnapshot(
      collection(db, "threads", threadId, "comments"),
      (snapshot) => {
        let list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        list.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
        list.sort((a, b) => {
          if (commentSort === "likes") return (b.likes || 0) - (a.likes || 0);
          return b.createdAt?.toMillis() - a.createdAt?.toMillis();
        });
        setComments(list);
      },
    );

    return () => {
      unsubUsers();
      unsubThread();
      unsubComments();
    };
  }, [threadId, commentSort]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString();
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalCommentInput("");
    setEditingCommentId(null);
    setOriginalContent("");
  };

  const confirmCancel = () => {
    if (modalCommentInput.trim() !== originalContent.trim()) {
      Alert.alert("Discard changes?", "You have unsaved changes.", [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: closeModal },
      ]);
    } else closeModal();
  };

  const submitComment = async () => {
    const trimmed = modalCommentInput.trim();
    if (!trimmed) return Alert.alert("Error", "Comment cannot be empty.");

    const action = editingCommentId
      ? "save changes to this comment"
      : "post this comment";

    Alert.alert("Confirm", `Are you sure you want to ${action}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: editingCommentId ? "Save" : "Post",
        onPress: async () => {
          try {
            const user = getAuth().currentUser;
            if (!user) throw new Error("Not logged in");

            if (editingCommentId) {
              await updateDoc(
                doc(db, "threads", threadId, "comments", editingCommentId),
                { content: trimmed, editedAt: new Date() },
              );
            } else {
              await addDoc(collection(db, "threads", threadId, "comments"), {
                commenterID: user.uid,
                content: trimmed,
                createdAt: new Date(),
                editedAt: null,
                likes: 0,
                likedBy: [],
              });
            }
            closeModal();
            Keyboard.dismiss();
          } catch (err) {
            Alert.alert(
              "Error",
              editingCommentId
                ? "Failed to save edited comment"
                : "Failed to submit comment",
            );
          }
        },
      },
    ]);
  };

  const confirmDelete = (commentId) => {
    Alert.alert("Delete", "Delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(
              doc(db, "threads", threadId, "comments", commentId),
            );
          } catch (err) {
            Alert.alert("Error", "Failed to delete comment");
          }
        },
      },
    ]);
  };

  const toggleCommentLike = async (comment) => {
    const user = getAuth().currentUser;
    if (!user) return;
    const commentRef = doc(db, "threads", threadId, "comments", comment.id);
    const hasLiked = comment.likedBy?.includes(user.uid);
    const updatedLikes = hasLiked
      ? (comment.likes || 0) - 1
      : (comment.likes || 0) + 1;
    await updateDoc(commentRef, {
      likes: updatedLikes,
      likedBy: hasLiked
        ? comment.likedBy.filter((id) => id !== user.uid)
        : [...(comment.likedBy || []), user.uid],
    });
  };

  if (!thread) return <ThemedText>Loading thread...</ThemedText>;

  return (
    <ThemedView style={{ flex: 1, padding: 20, paddingTop: 10 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <ThemedText style={{ fontSize: 22, fontWeight: "bold", flex: 1 }}>
          {thread.title}
        </ThemedText>
        <TouchableOpacity
          testID="thread-like-button"
          onPress={async () => {
            const user = getAuth().currentUser;
            if (!user) return;
            const threadRef = doc(db, "threads", threadId);
            const hasLiked = thread.likedBy?.includes(user.uid);
            const updatedLikes = hasLiked
              ? thread.likes - 1
              : (thread.likes || 0) + 1;
            await updateDoc(threadRef, {
              likes: updatedLikes,
              likedBy: hasLiked
                ? thread.likedBy.filter((id) => id !== user.uid)
                : [...(thread.likedBy || []), user.uid],
            });
          }}
        >
          <Ionicons
            name={
              thread.likedBy?.includes(currentUserId)
                ? "heart"
                : "heart-outline"
            }
            size={26}
            color="red"
          />
        </TouchableOpacity>
        <ThemedText style={{ marginLeft: 2, fontSize: 12 }}>
          {thread.likes || 0}
        </ThemedText>
      </View>

      <ThemedText style={{ marginBottom: 30, fontSize: 12 }}>
        by{" "}
        <ThemedText
          style={{ color: "#007AFF" }}
          onPress={() => router.push(`/(profiles)/${thread.authorId}`)}
        >
          {thread.authorId === currentUserId
            ? "You"
            : userNames[thread.authorId] || "Loading..."}
        </ThemedText>{" "}
        · {thread.category} · {formatDate(thread.createdAt)}
      </ThemedText>

      <ThemedText style={{ fontSize: 18 }}>{thread.content}</ThemedText>

      {thread.mediaUrl && thread.mediaType === "image" ? (
        <TouchableOpacity onPress={() => setZoomImageModalVisible(true)}>
          <Image
            source={{ uri: thread.mediaUrl }}
            style={{ height: 200, marginTop: 10 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : thread.mediaUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: thread.mediaUrl }}
          useNativeControls
          style={{ height: 200, marginTop: 10 }}
          resizeMode="contain"
        />
      ) : null}

      <Spacer height={20} />

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <ThemedText style={{ fontWeight: "bold", fontSize: 16, flex: 1 }}>
          Comments:
        </ThemedText>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons
            testID="addCommentButton"
            name="add-circle-outline"
            size={28}
            color="#007AFF"
          />
        </TouchableOpacity>
      </View>

      <DropDownPicker
        open={sortOpen}
        setOpen={setSortOpen}
        value={commentSort}
        setValue={setCommentSort}
        items={[
          { label: "Newest", value: "newest" },
          { label: "Most Liked", value: "likes" },
        ]}
        containerStyle={{ marginBottom: 10, width: 140 }}
        zIndex={999}
      />

      {comments.length === 0 ? (
        <ThemedText style={{ textAlign: "center", color: "grey" }}>
          No comments yet. Press "+" to add one!
        </ThemedText>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ThemedText>- {item.content}</ThemedText>

                {/* Show edit/delete icons only for comment owner */}
                {item.commenterID === currentUserId && (
                  <>
                    <TouchableOpacity
                      testID={`edit-comment-button-${item.id}`}
                      onPress={() => {
                        setModalCommentInput(item.content);
                        setEditingCommentId(item.id);
                        setOriginalContent(item.content);
                        setModalVisible(true);
                      }}
                      style={{ marginHorizontal: 6 }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color="#007AFF"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      testID={`delete-comment-button-${item.id}`}
                      onPress={() => confirmDelete(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#ff3b30"
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <ThemedText style={{ fontSize: 12, color: "#777" }}>
                  by{" "}
                  <ThemedText
                    style={{ color: "#007AFF" }}
                    onPress={() =>
                      router.push(`/(profiles)/${item.commenterID}`)
                    }
                  >
                    {item.commenterID === currentUserId
                      ? "You"
                      : userNames[item.commenterID] || "Loading..."}
                  </ThemedText>{" "}
                  · {formatDate(item.createdAt)} {item.editedAt && "(edited)"}
                </ThemedText>
                <TouchableOpacity
                  testID={`comment-like-button-${item.id}`}
                  onPress={() => toggleCommentLike(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 6,
                  }}
                >
                  <Ionicons
                    name={
                      item.likedBy?.includes(currentUserId)
                        ? "heart"
                        : "heart-outline"
                    }
                    size={14}
                    color="#ff4d4d"
                  />
                  <ThemedText style={{ marginLeft: 2, fontSize: 12 }}>
                    {item.likes || 0}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={confirmCancel}
        testID="add-comment-modal"
      >
        <Pressable style={styles.modalOverlay} onPress={confirmCancel}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
              >
                {editingCommentId ? "Edit Comment" : "Add Comment"}
              </Text>
              <TextInput
                value={modalCommentInput}
                onChangeText={setModalCommentInput}
                multiline
                style={[styles.input, { height: 100 }]}
                placeholder="Write your comment here..."
                placeholderTextColor="grey"
              />
              <View style={{ flexDirection: "row", marginTop: 15, gap: 10 }}>
                <ThemedButton onPress={submitComment} style={{ flex: 1 }}>
                  <ThemedText style={{ color: "#fff", textAlign: "center" }}>
                    {editingCommentId ? "Save" : "Post"}
                  </ThemedText>
                </ThemedButton>
                <ThemedButton
                  onPress={confirmCancel}
                  style={{ flex: 1, backgroundColor: "#888" }}
                >
                  <ThemedText style={{ color: "#fff", textAlign: "center" }}>
                    Cancel
                  </ThemedText>
                </ThemedButton>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal
        visible={zoomImageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomImageModalVisible(false)}
      >
        <Pressable
          style={styles.zoomModalContainer}
          onPress={() => setZoomImageModalVisible(false)}
        >
          <Image
            source={{ uri: thread.mediaUrl }}
            style={styles.zoomedImage}
            resizeMode="contain"
          />
          <Text style={styles.closeText}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>
    </ThemedView>
  );
};

export default ThreadDetailPage;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 20,
  },
  zoomModalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: {
    width: "100%",
    height: "80%",
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
    opacity: 0.6,
  },
});
