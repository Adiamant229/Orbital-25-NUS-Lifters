//react imports
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  View,
  Image
} from "react-native";
import uuid from "react-native-uuid";
import { Video } from "expo-video";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

//firebase imports
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  updateDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, storage } from "../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

//themed components
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";


const categories = ["Training", "Diet", "Cardio"];

const Forum = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [newContent, setNewContent] = useState("");

  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedThread, setSelectedThread] = useState(null);
  const [comments, setComments] = useState([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editThread, setEditThread] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState(categories[0]);
  const [editContent, setEditContent] = useState("");

  const [commentInput, setCommentInput] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  // New state to store user names dynamically
  const [userNames, setUserNames] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }

    // Listener for all user names
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const names = {};
        snapshot.forEach((doc) => {
          names[doc.id] = doc.data().name || "Anonymous";
        });
        setUserNames(names);
      },
      (error) => {
        console.error("Error fetching user names in real-time: ", error);
      }
    );

    let q;
    if (selectedCategory === "All") {
      q = query(collection(db, "threads"));
    } else {
      q = query(
        collection(db, "threads"),
        where("category", "==", selectedCategory)
      );
    }

    setLoading(true);
    const unsubscribeThreads = onSnapshot(
      q,
      (snapshot) => {
        const threadsList = [];
        snapshot.forEach((doc) => {
          threadsList.push({ id: doc.id, ...doc.data() });
        });
        threadsList.sort(
          (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()
        );
        setThreads(threadsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching threads in real-time: ", error);
        setLoading(false);
      }
    );

    // Return a cleanup function that unsubscribes from both listeners
    return () => {
      unsubscribeUsers();
      unsubscribeThreads();
    };
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedThread) {
      return;
    }

    const threadUnsubscribe = onSnapshot(
      doc(db, "threads", selectedThread.id),
      (snapshot) => {
        if (snapshot.exists()) {
          setSelectedThread({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          console.warn("Thread document no longer exists");
          setSelectedThread(null);
          setComments([]);
          setEditingComment(null);
          setCommentInput("");
        }
      },
      (error) => {
        console.error("Error fetching selected thread in real-time: ", error);
      }
    );

    const commentUnsubscribe = onSnapshot(
      collection(db, "threads", selectedThread.id, "comments"),
      (snapshot) => {
        const updatedComments = [];
        snapshot.forEach((doc) => {
          updatedComments.push({ id: doc.id, ...doc.data() });
        });

        updatedComments.sort(
          (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
        );
        setComments(updatedComments);
      },
      (error) => {
        console.error("Error fetching comments in real-time: ", error);
      }
    );

    return () => {
      commentUnsubscribe();
      threadUnsubscribe();
    };
  }, [selectedThread?.id]);

  const addThread = () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a thread title.");
      return;
    }
    if (!newContent.trim()) {
      Alert.alert("Error", "Please enter some content for the thread.");
      return;
    }

    Alert.alert(
      "Confirm Create",
      "Do you really want to create this thread?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Create",
          onPress: async () => {
            try {
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) {
                Alert.alert("Error", "User not logged in");
                return;
              }

              const mediaUrl = await uploadMediaToStorage();
              await addDoc(collection(db, "threads"), {
                title: newTitle,
                category: newCategory,
                authorId: user.uid,
                content: newContent,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null,
                createdAt: new Date(),
              });
              

              Alert.alert("Success", "Thread created!");
              setModalVisible(false);
              setNewTitle("");
              setNewCategory(categories[0]);
              setNewContent("");
            } catch (error) {
              console.error("Error adding thread: ", error);
              Alert.alert("Error", "Could not create thread.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const deleteThread = async (threadId) => {
    Alert.alert(
      "Delete Thread",
      "Are you sure you want to delete this thread?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "threads", threadId));
              Alert.alert("Deleted", "Thread removed successfully.");

              if (selectedThread?.id === threadId) {
                setSelectedThread(null);
              }
            } catch (error) {
              console.error("Error deleting thread: ", error);
              Alert.alert("Error", "Could not delete thread.");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (thread) => {
    setEditThread(thread);
    setEditTitle(thread.title);
    setEditCategory(thread.category);
    setEditContent(thread.content);
    setEditModalVisible(true);
  };

  const updateThread = () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Please enter a thread title.");
      return;
    }
    if (!editContent.trim()) {
      Alert.alert("Error", "Please enter some content for the thread.");
      return;
    }

    Alert.alert(
      "Confirm Save",
      "Do you really want to save changes to this thread?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Save",
          onPress: async () => {
            try {
              const threadDocRef = doc(db, "threads", editThread.id);
              const mediaUrl = await uploadMediaToStorage();
              await updateDoc(threadDocRef, {
                title: editTitle,
                category: editCategory,
                content: editContent,
                mediaUrl: mediaUrl || editThread.mediaUrl || null,
                mediaType: mediaType || editThread.mediaType || null,
                updatedAt: new Date(),
              });
              
              Alert.alert("Success", "Thread updated!");
              setEditModalVisible(false);
              setEditThread(null);
            } catch (error) {
              console.error("Error updating thread: ", error);
              Alert.alert("Error", "Could not update thread.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const cancelCreateThread = () => {
    const hasChanges =
      newTitle.trim() !== "" ||
      newContent.trim() !== "" ||
      newCategory !== categories[0];

    if (hasChanges) {
      Alert.alert(
        "Discard Thread?",
        "You have started creating a new thread. Are you sure you want to discard this thread?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setModalVisible(false);
              setNewTitle("");
              setNewCategory(categories[0]);
              setNewContent("");
            },
          },
        ]
      );
    } else {
      setModalVisible(false);
    }
  };

  const cancelEditThread = () => {
    if (!editThread) {
      setEditModalVisible(false);
      return;
    }

    const hasTitleChanged =
      editTitle.trim() !== (editThread.title?.trim() || "");
    const hasContentChanged =
      editContent.trim() !== (editThread.content?.trim() || "");
    const hasCategoryChanged = editCategory !== editThread.category;

    const hasChanges =
      hasTitleChanged || hasContentChanged || hasCategoryChanged;

    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setEditModalVisible(false);
              setEditThread(null);
            },
          },
        ]
      );
    } else {
      setEditModalVisible(false);
      setEditThread(null);
    }
  };

  const addComment = async (threadID, content) => {
    if (!content.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    Alert.alert(
      "Confirm Post",
      "Are you sure you want to post this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Post",
          onPress: async () => {
            try {
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) {
                Alert.alert("Error", "User not logged in.");
                return;
              }

              const threadRef = doc(db, "threads", threadID);
              const threadSnap = await getDoc(threadRef);
              if (!threadSnap.exists()) {
                Alert.alert("Error", "Thread not found");
                return;
              }
              const commentsRef = collection(threadRef, "comments");
              const comment = {
                commenterID: user.uid, // Store only the ID
                content: content,
                createdAt: new Date(),
                editedAt: null,
              };
              await addDoc(commentsRef, comment);
              setCommentInput("");
              Keyboard.dismiss();
            } catch (err) {
              console.error("Error adding comment: ", err);
              Alert.alert("Error", "Could not add comment.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const editComment = async (threadID, commentID, content) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      const commentRef = doc(db, "threads", threadID, "comments", commentID);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        Alert.alert("Error", "Comment not found.");
        return;
      }

      const comment = commentSnap.data();

      if (currentUserId !== comment.commenterID) {
        throw new Error("Trying to edit comment without being the commenter");
      }

      Alert.alert(
        "Confirm Save",
        "Do you want to save changes to this comment?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Save",
            onPress: async () => {
              try {
                await updateDoc(commentRef, {
                  content: trimmedContent,
                  editedAt: new Date(),
                });
                setEditingComment(null);
                setEditingCommentContent("");
                Keyboard.dismiss();
                Alert.alert("Success", "Comment updated!");
              } catch (err) {
                console.error("Error saving edited comment: ", err);
                Alert.alert("Error", "Could not update comment.");
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error("Error preparing comment for edit: ", err);
      Alert.alert("Error", "Could not fetch comment.");
    }
  };

  const deleteComment = async (threadID, commentID) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) {
                Alert.alert("Error", "User not logged in");
                return;
              }
              const commentRef = doc(
                db,
                "threads",
                threadID,
                "comments",
                commentID
              );
              const commentSnap = await getDoc(commentRef);
              const comment = commentSnap.data();
              if (!commentSnap.exists()) {
                throw new Error("Comment not found");
              }
              if (currentUserId !== comment.commenterID) {
                throw new Error(
                  "Trying to delete comment without being the commenter"
                );
              }
              await deleteDoc(commentRef);
            } catch (err) {
              console.error("Error deleting comment: ", err);
              Alert.alert("Error", "Could not delete comment.");
            }
          },
        },
      ]
    );
  };

  const cancelEditComment = () => {
    if (!editingComment) {
      setEditingComment(null);
      setEditingCommentContent("");
      return;
    }

    const originalContent = editingComment.content?.trim() || "";
    const currentContent = editingCommentContent.trim();
    const hasChanges = currentContent !== originalContent;

    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes to this comment. Are you sure you want to discard them?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setEditingComment(null);
              setEditingCommentContent("");
            },
          },
        ]
      );
    } else {
      setEditingComment(null);
      setEditingCommentContent("");
    }
  };

  const router = useRouter();

  // Media state
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null); // "image" or "video"

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Media access is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.All,
      quality: 0.7,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type); // "image" or "video"
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.All,
      quality: 0.7,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type);
    }
  };

  const uploadMediaToStorage = async () => {
    if (!mediaUri) return null;
    const response = await fetch(mediaUri);
    const blob = await response.blob();
    const extension = mediaType === "video" ? ".mp4" : ".jpg";
    const mediaRef = ref(storage, `threadMedia/${uuid.v4()}${extension}`);
    await uploadBytes(mediaRef, blob);
    return await getDownloadURL(mediaRef);
  };


  const formatDateForDisplay = (timestamp, timePeriod = "") => {
    if (!timestamp) return "";
    const createdDate = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);
    const now = new Date();

    function calendarDaysDiff(d1, d2) {
      const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
      const diffTime = date2.getTime() - date1.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const diffDays = calendarDaysDiff(createdDate, now);

    const dateStr = createdDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    let relativeStr;
    if (diffDays === 0) relativeStr = "Today";
    else if (diffDays === 1) relativeStr = "1 day ago";
    else relativeStr = `${diffDays} days ago`;

    return `${dateStr} (${relativeStr})`;
  };
  
  return (
    <ThemedView style={styles.innerContainer}>
      <ThemedText style={styles.title} title={true}>
        Official NUS Lifters Club Forum
      </ThemedText>
      <View style={styles.filterContainerRow}>
        <View style={styles.filterButtonsRow}>
          {["All", ...categories].map((cat) => (
            <ThemedButton
              key={cat}
              style={[
                styles.filterButton,
                selectedCategory === cat && styles.filterButtonSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.filterText}>{cat}</Text>
            </ThemedButton>
          ))}
        </View>

        <ThemedButton
          onPress={() => setModalVisible(true)}
          style={styles.filterButton}
        >
          <Text style={styles.filterText}>+</Text>
        </ThemedButton>
      </View>
      {loading ? (
        <Text>Loading threads...</Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              testID={"thread-card-button"}
              onPress={() => {
                setSelectedThread(item);
              }}
            >
              <ThemedView style={styles.threadCard}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.threadTitle}>{item.title}</Text>
                    <Text style={styles.threadMeta}>
                      by{" "}
                      {item.authorId === currentUserId
                        ? "You"
                        : userNames[item.authorId] || "Loading..."}{" "}
                      · {item.category} 
                    </Text>
                    <Text
                      style={styles.threadSnippet}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.content}
                    </Text>
                  </View>

                  {item.authorId === currentUserId && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable
                        onPress={() => openEditModal(item)}
                        testID="edit-thread-button"
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => deleteThread(item.id)}
                        testID="delete-thread-button"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff3b30"
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </ThemedView>
            </Pressable>
          )}
          contentContainerStyle={{ gap: 16 }}
        />
      )}

      {/* New Thread Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalBackdrop}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Create New Thread</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Thread Title"
                  placeholderTextColor={"grey"}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text style={{ marginTop: 10 }}>Category:</Text>
                <View style={styles.filterContainer}>
                  {categories.map((cat) => (
                    <ThemedButton
                      key={cat}
                      style={[
                        styles.filterButton,
                        newCategory === cat && styles.filterButtonSelected,
                      ]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={styles.filterText}>{cat}</Text>
                    </ThemedButton>
                  ))}
                </View>

                <Text style={{ marginTop: 10 }}>Content:</Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 100, textAlignVertical: "top" },
                  ]}
                  placeholder="Write your thread content here..."
                  placeholderTextColor={"grey"}
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline={true}
                />
                <View style={{ marginTop: 10 }}>
                  <Text style={{ marginBottom: 5 }}>
                    Attach Media (optional):
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <ThemedButton onPress={pickMedia}>
                      <Text style={{ color: "white" }}>Pick from Gallery</Text>
                    </ThemedButton>
                    <ThemedButton onPress={takePhoto}>
                      <Text style={{ color: "white" }}>Take Photo/Video</Text>
                    </ThemedButton>
                  </View>

                  {mediaUri && (
                    <>
                      {mediaType === "image" ? (
                        <Image
                          source={{ uri: mediaUri }}
                          style={{ height: 150, marginTop: 10 }}
                        />
                      ) : (
                        <Text style={{ marginTop: 10 }}>Video selected</Text>
                      )}
                      <TouchableOpacity onPress={() => setMediaUri(null)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff3b30"
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <ThemedButton
                    onPress={addThread}
                    style={{ flex: 1, marginRight: 10 }}
                  >
                    <Text style={styles.filterText}>Create</Text>
                  </ThemedButton>

                  <ThemedButton
                    onPress={cancelCreateThread}
                    style={{ flex: 1 }}
                  >
                    <Text style={styles.filterText}>Cancel</Text>
                  </ThemedButton>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Thread Modal */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalBackdrop}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Edit Thread</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Thread Title"
                  placeholderTextColor={"grey"}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />
                <Text style={{ marginTop: 10 }}>Category:</Text>
                <View style={styles.filterContainer}>
                  {categories.map((cat) => (
                    <ThemedButton
                      key={cat}
                      style={[
                        styles.filterButton,
                        editCategory === cat && styles.filterButtonSelected,
                      ]}
                      onPress={() => setEditCategory(cat)}
                    >
                      <Text style={styles.filterText}>{cat}</Text>
                    </ThemedButton>
                  ))}
                </View>
                <Text style={{ marginTop: 10 }}>Content:</Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 100, textAlignVertical: "top" },
                  ]}
                  placeholder="Edit your thread content here..."
                  placeholderTextColor={"grey"}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline={true}
                />
                <View style={{ marginTop: 10 }}>
                  <Text style={{ marginBottom: 5 }}>
                    Attach Media (optional):
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <ThemedButton onPress={pickMedia}>
                      <Text style={{ color: "white" }}>Pick from Gallery</Text>
                    </ThemedButton>
                    <ThemedButton onPress={takePhoto}>
                      <Text style={{ color: "white" }}>Take Photo/Video</Text>
                    </ThemedButton>
                  </View>

                  {mediaUri && (
                    <>
                      {mediaType === "image" ? (
                        <Image
                          source={{ uri: mediaUri }}
                          style={{ height: 150, marginTop: 10 }}
                        />
                      ) : (
                        <Text style={{ marginTop: 10 }}>Video selected</Text>
                      )}
                      <TouchableOpacity onPress={() => setMediaUri(null)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff3b30"
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <ThemedButton
                    onPress={updateThread}
                    style={{ flex: 1, marginRight: 10 }}
                  >
                    <Text style={styles.filterText}>Save</Text>
                  </ThemedButton>

                  <ThemedButton onPress={cancelEditThread} style={{ flex: 1 }}>
                    <Text style={styles.filterText}>Cancel</Text>
                  </ThemedButton>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Thread Detail Modal */}
      <Modal
        visible={selectedThread !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setSelectedThread(null);
          setComments([]);
          setEditingComment(null);
          setEditingCommentContent("");
          setCommentInput("");
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setSelectedThread(null);
            setComments([]);
            setEditingComment(null);
            setEditingCommentContent("");
            setCommentInput("");
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalBackdrop}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                {selectedThread !== null && (
                  <>
                    <Text style={styles.threadTitle}>
                      {selectedThread.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          router.push(`/(profiles)/${selectedThread.authorId}`);
                          setSelectedThread(null);
                          setComments([]);
                          setEditingComment(null);
                          setEditingCommentContent("");
                          setCommentInput("");
                        }}
                      >
                        <Text style={[styles.threadMeta, { color: "#007AFF" }]}>
                          by{" "}
                          {selectedThread.authorId === currentUserId
                            ? "You"
                            : userNames[selectedThread.authorId] ||
                              "Loading..."}
                        </Text>
                      </Pressable>
                      <Text style={styles.threadMeta}>
                        {" · "}
                        {selectedThread.category}
                        {" · "}
                        {formatDateForDisplay(selectedThread.createdAt)}
                      </Text>
                    </View>
                    <Spacer height={20} />
                    <Text style={styles.threadContent}>
                      {selectedThread.content}
                    </Text>
                    {selectedThread.mediaUrl &&
                      (selectedThread.mediaType === "image" ? (
                        <Image
                          source={{ uri: selectedThread.mediaUrl }}
                          style={{
                            height: 200,
                            borderRadius: 10,
                            marginTop: 10,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Video
                          source={{ uri: selectedThread.mediaUrl }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={false}
                          resizeMode="contain"
                          shouldPlay
                          useNativeControls
                          style={{
                            height: 200,
                            borderRadius: 10,
                            marginTop: 10,
                          }}
                        />
                      ))}
                    {comments !== null && (
                      <>
                        <Spacer height={20} />
                         
                        <Text style={styles.commentHead}>Comments:</Text>
                        <FlatList
                          data={comments}
                          extraData={editingComment}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => {
                            return editingComment !== null &&
                              item.id === editingComment ? (
                              <>
                                <TextInput
                                  style={[
                                    styles.input,
                                    { height: 100, textAlignVertical: "top" },
                                  ]}
                                  value={editingCommentContent}
                                  onChangeText={setEditingCommentContent}
                                  multiline={true}
                                />
                                <View
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    marginTop: 20,
                                  }}
                                >
                                  <ThemedButton
                                    onPress={() =>
                                      editComment(
                                        selectedThread.id,
                                        item.id,
                                        editingCommentContent
                                      )
                                    }
                                    style={{ flex: 1, marginRight: 10 }}
                                  >
                                    <Text style={styles.filterText}>Save</Text>
                                  </ThemedButton>

                                  <ThemedButton
                                    onPress={cancelEditComment}
                                    style={{ flex: 1 }}
                                  >
                                    <Text style={styles.filterText}>
                                      Cancel
                                    </Text>
                                  </ThemedButton>
                                </View>
                              </>
                            ) : (
                              <View style={styles.commentItem}>
                                <Text style={styles.commentContent}>
                                  - {item.content}
                                </Text>

                                <View
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                  }}
                                >
                                  <Pressable
                                    onPress={() => {
                                      router.push(
                                        `/(profiles)/${item.commenterID}`
                                      );
                                      setSelectedThread(null);
                                      setComments([]);
                                      setEditingComment(null);
                                      setEditingCommentContent("");
                                      setCommentInput("");
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.commentAuthor,
                                        { color: "#007AFF" },
                                      ]}
                                    >
                                      by{" "}
                                      {item.commenterID === currentUserId
                                        ? "You"
                                        : userNames[item.commenterID] ||
                                          "Loading..."}
                                    </Text>
                                  </Pressable>
                                  <Text style={[styles.commentAuthor]}>
                                    {" · "}
                                    {formatDateForDisplay(item.createdAt)}
                                  </Text>
                                  {item.editedAt && (
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        color: "#888",
                                        marginLeft: 4,
                                      }}
                                    >
                                      (edited)
                                    </Text>
                                  )}
                                </View>

                                <Spacer height={10} />
                                {item.commenterID === currentUserId && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      gap: 10,
                                    }}
                                  >
                                    <Pressable
                                      onPress={() => {
                                        setEditingComment(item.id);
                                        setEditingCommentContent(item.content);
                                      }}
                                      testID="edit-comment-button"
                                    >
                                      <Ionicons
                                        name="pencil-outline"
                                        size={20}
                                        color="#007AFF"
                                      />
                                    </Pressable>
                                    <Pressable
                                      onPress={() =>
                                        deleteComment(
                                          selectedThread.id,
                                          item.id
                                        )
                                      }
                                    >
                                      <Ionicons
                                        name="trash-outline"
                                        size={20}
                                        color="#ff3b30"
                                      />
                                    </Pressable>
                                  </View>
                                )}
                              </View>
                            );
                          }}
                          contentContainerStyle={{ paddingVertical: 10 }}
                        />
                      </>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 10,
                      }}
                    >
                      <TextInput
                        style={[styles.input, { flex: 1, height: 40 }]}
                        placeholder="Add a comment..."
                        placeholderTextColor={"grey"}
                        value={commentInput}
                        onChangeText={setCommentInput}
                        onSubmitEditing={() => {
                          if (commentInput.trim()) {
                            addComment(selectedThread.id, commentInput);
                          }
                        }}
                      />
                      <ThemedButton
                        onPress={() => {
                          addComment(selectedThread.id, commentInput);
                        }}
                        style={{ marginLeft: 10 }}
                      >
                        <Text style={styles.filterText}>Post</Text>
                      </ThemedButton>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
};

export default Forum;

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 80
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center"
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 5,
  },
  filterContainerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  filterButtonsRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  filterButton: {
    width: 62,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#2196f3",
    alignItems: "center",
  },
  filterButtonSelected: {
    backgroundColor: "#7d015c",
  },
  filterText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  threadCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 10,
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  threadMeta: {
    fontSize: 12,
    color: "#555",
  },
  threadSnippet: {
    marginTop: 5,
    fontSize: 14,
    color: "#333",
  },
  threadContent: {
    fontSize: 16,
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
  },
  commentHead: {
    fontSize: 16,
  },
  commentAuthor: {
    fontSize: 12,
  },
  commentItem: {
    paddingHorizontal: 20,
    borderColor: "#D3D3D3",
    borderRadius: 1,
  },
  commentContent: {
    fontSize: 16,
  },
});