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
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";

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
import { db } from "../../firebaseConfig";

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
  const [newContent, setNewContent] = useState(""); // New state for content

  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedThread, setSelectedThread] = useState(null); // State for thread detail modal
  const [comments, setComments] = useState([]);

  // Edit thread states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editThread, setEditThread] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState(categories[0]);
  const [editContent, setEditContent] = useState("");

  const [commentInput, setCommentInput] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState(""); 

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }

    // Real-time listener for threads
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
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const threadsList = [];
        snapshot.forEach((doc) => {
          threadsList.push({ id: doc.id, ...doc.data() });
        });
        // Sort threads by createdAt in descending order (newest first)
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

   
    return () => unsubscribe();
  }, [selectedCategory]); 

  useEffect(() => {
    if (!selectedThread) {
      return;
    }

    // Real-time listener for the selected thread
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

    // Real-time listener for comments of the selected thread
    const commentUnsubscribe = onSnapshot(
      collection(db, "threads", selectedThread.id, "comments"),
      (snapshot) => {
        const updatedComments = [];
        snapshot.forEach((doc) => {
          updatedComments.push({ id: doc.id, ...doc.data() });
        });
        // Sort comments by createdAt in ascending order
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
          onPress: () => {
            // Do nothing, just dismiss
          },
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

              // Fetch fresh username from Firestore:
              const userDocRef = doc(db, "users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
              const freshUserName = userDocSnap.exists()
                ? userDocSnap.data().name
                : "Anonymous";

              await addDoc(collection(db, "threads"), {
                title: newTitle,
                category: newCategory,
                author: freshUserName,
                authorId: user.uid,
                content: newContent,
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
              // onSnapshot listener will automatically update the threads state
              if (selectedThread?.id === threadId) {
                setSelectedThread(null); // Close the detail modal if the current thread is deleted
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

  // Open edit modal and prefill fields
  const openEditModal = (thread) => {
    setEditThread(thread);
    setEditTitle(thread.title);
    setEditCategory(thread.category);
    setEditContent(thread.content); 
    setEditModalVisible(true);
  };

  // Update thread in Firestore
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
          onPress: () => {
            // Do nothing, just dismiss
          },
        },
        {
          text: "Save",
          onPress: async () => {
            try {
              const threadDocRef = doc(db, "threads", editThread.id);
              await updateDoc(threadDocRef, {
                title: editTitle,
                category: editCategory,
                content: editContent,
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
      "Do you really want to post this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
          },
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
              const userDocRef = doc(db, "users", user?.uid);
              const userDocSnap = await getDoc(userDocRef);
              const commenter = userDocSnap.exists()
                ? userDocSnap.data().name
                : "Anonymous";
              const threadRef = doc(db, "threads", threadID);
              const threadSnap = await getDoc(threadRef);
              if (!threadSnap.exists()) {
                Alert.alert("Error", "Thread not found");
                return;
              }
              const commentsRef = collection(threadRef, "comments");
              const comment = {
                commenter: commenter,
                commenterID: user.uid,
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
              // The onSnapshot listener will automatically update the comments state
              // No need to manually filter here.
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
                      by {item.author} · {item.category}
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
          setEditingComment(null); // Reset editing comment state
          setEditingCommentContent(""); // Clear editing comment content
          setCommentInput(""); // Clear comment input
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setSelectedThread(null);
            setComments([]);
            setEditingComment(null); // Reset editing comment state
            setEditingCommentContent(""); // Clear editing comment content
            setCommentInput(""); // Clear comment input
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
                    <Text style={styles.threadMeta}>
                      by {selectedThread.author} · {selectedThread.category}
                    </Text>
                    <Spacer height={20} />
                    <Text style={styles.threadContent}>
                      {selectedThread.content}
                    </Text>
                    {comments !== null && (
                      <>
                        <Spacer height={20} />
                        <Text style={styles.commentHead}>Comments:</Text>
                        <FlatList
                          data={comments}
                          extraData={editingComment} // Ensure FlatList re-renders when editingComment changes
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
                                  value={editingCommentContent} // Use the new state for comment editing
                                  onChangeText={setEditingCommentContent} // Use the new setter
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
                                        editingCommentContent // Use the correct state for comment editing here
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
                                <Text style={styles.commentAuthor}>
                                  by {item.commenter}
                                  {item.editedAt && (
                                    <Text
                                      style={{ fontSize: 10, color: "#888" }}
                                    >
                                      {" "}
                                      (edited)
                                    </Text>
                                  )}
                                </Text>
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
                                        setEditingCommentContent(item.content); // Prefill the edit input
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
    paddingTop: 70
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
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
