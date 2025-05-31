//react and expo imports
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  FlatList,
  View,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

//firebase imports 
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
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
  const [newAuthor, setNewAuthor] = useState("Anonymous");

  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedThread, setSelectedThread] = useState(null); // State for thread detail modal

  // Edit thread states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editThread, setEditThread] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState(categories[0]);
  const [editContent, setEditContent] = useState("");

  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState([]);


    useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      setNewAuthor(user.displayName || "Anonymous");
    }
    fetchThreads();
  }, [selectedCategory]);
    useEffect(() => {
        const refreshThread = async () => {
            if (selectedThread) {
                try {
                    const threadRef = doc(db, "threads", selectedThread.id);
                    const threadSnap = await getDoc(threadRef);
                    if (threadSnap.exists()) {
                        setSelectedThread({id: threadSnap.id, ...threadSnap.data()});
                    }
                } catch (err) {
                    console.error("Error refreshing thread", err);
                }
            }
        };
        refreshThread();
    }, [selectedThread?.comments?.length])

  const fetchThreads = async () => {
    setLoading(true);
    try {
      let q;
      if (selectedCategory === "All") {
        q = query(collection(db, "threads"));
      } else {
        q = query(
          collection(db, "threads"),
          where("category", "==", selectedCategory)
        );
      }

      const querySnapshot = await getDocs(q);
      const threadsList = [];
      querySnapshot.forEach((doc) => {
        threadsList.push({ id: doc.id, ...doc.data() });
      });

      setThreads(threadsList);
    } catch (error) {
      console.error("Error fetching threads: ", error);
    } finally {
      setLoading(false);
    }
  };

  const addThread = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a thread title.");
      return;
    }
    if (!newContent.trim()) {
      Alert.alert("Error", "Please enter some content for the thread.");
      return;
    }
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
        content: newContent, // Save content here
        createdAt: new Date(),
      });
      Alert.alert("Success", "Thread created!");
      setModalVisible(false);
      setNewTitle("");
      setNewCategory(categories[0]);
      setNewContent(""); // Clear content input
      fetchThreads();
    } catch (error) {
      console.error("Error adding thread: ", error);
      Alert.alert("Error", "Could not create thread.");
    }
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
              fetchThreads();
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
  const updateThread = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Please enter a thread title.");
      return;
    }
    if (!editContent.trim()) {
      Alert.alert("Error", "Please enter some content for the thread.");
      return;
    }

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
      fetchThreads();
    } catch (error) {
      console.error("Error updating thread: ", error);
      Alert.alert("Error", "Could not update thread.");
    }
  };

  const addComment = async (threadID, content) => {
      if (!content.trim()) {
          Alert.alert("Error", "Please enter a comment");
          return;
      }
      try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) {
              Alert.alert("Error", "User not logged in.");
              return;
          }
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          const commenter = userDocSnap.exists()
              ? userDocSnap.data().name
              : "Anonymous";

          const threadRef = doc(db, "threads", threadID);
          const threadSnap = await getDoc(threadRef);
          if (!threadSnap.exists()) {
              Alert.alert("Error", "Thread not found")
              return;
          }
          const comments = threadSnap.data().comments || [];
          const newID = comments.length;
          const comment = {
              commenter: commenter,
              id: newID,
              content: content,
              createdAt: new Date()
          };
          await updateDoc(threadRef, {
              comments: arrayUnion(comment)
          });
          const updatedThreadSnap = await getDoc(threadRef);
          if (updatedThreadSnap.exists()) {
              setSelectedThread({ id: updatedThreadSnap.id, ...updatedThreadSnap.data() });
          }
          Alert.alert

      } catch(err) {
          console.error("Error adding comment: ", err);
          Alert.alert("Error", "Could not add comment.");
      }
  }

/*  const loadComments = async (threadID) => {
      try {
          const q = query(
              collection(db, "threads", threadID, "comments"),
              orderBy("createdAt", "asc")
          );
          const querySnap = await getDocs(q);
          const commentList = [];
          querySnap.forEach((doc) =>
              commentList.push({
                id: doc.id,
                ...doc.data() }));
          setComments(commentList);
      } catch(err) {
          console.error("Error loading comments: ", err);
      }
  }; */

  return (
    <ThemedView style={styles.innerContainer}>
      <Spacer />
      <Spacer />
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
                { width: 5, paddingHorizontal: 5 },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.filterText}>{cat}</Text>
            </ThemedButton>
          ))}
        </View>

        <ThemedButton
          onPress={() => setModalVisible(true)}
          style={styles.newThreadButton}
        >
          <Text style={styles.filterText}>+</Text>
        </ThemedButton>
      </View>

      <Spacer size={10} />

      {loading ? (
        <Text>Loading threads...</Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedThread(item)}>
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
                      <Pressable onPress={() => openEditModal(item)}>
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </Pressable>
                      <Pressable onPress={() => deleteThread(item.id)}>
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Create New Thread</Text>

              <TextInput
                style={styles.input}
                placeholder="Thread Title"
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
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 10 }}
                >
                  <Text style={styles.filterText}>Cancel</Text>
                </ThemedButton>
                <ThemedButton onPress={addThread} style={{ flex: 1 }}>
                  <Text style={styles.filterText}>Create</Text>
                </ThemedButton>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Thread Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Thread</Text>{" "}
              <TextInput
                style={styles.input}
                placeholder="Thread Title"
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
                  onPress={() => setEditModalVisible(false)}
                  style={{ flex: 1, marginRight: 10 }}
                >
                  <Text style={styles.filterText}>Cancel</Text>
                </ThemedButton>
                <ThemedButton onPress={updateThread} style={{ flex: 1 }}>
                  <Text style={styles.filterText}>Save</Text>
                </ThemedButton>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Thread Detail Modal */}
      <Modal
        visible={selectedThread !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedThread(null)}
      >
          <TouchableWithoutFeedback onPress={() => setSelectedThread(null)}>
              <View style={styles.modalBackdrop}>
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={styles.modalContainer}>
                      {selectedThread && (
                        <>
                          <Text style={styles.threadTitle}>{selectedThread.title}</Text>
                          <Text style={styles.threadMeta}>
                            by {selectedThread.author} · {selectedThread.category}
                          </Text>
                            <Spacer height={20}/>
                          <Text style={styles.threadContent}>
                            {selectedThread.content}
                          </Text>
                          { selectedThread.comments && (
                              <>
                                  <Spacer height ={20}/>
                              <Text style={styles.commentHead}>Comments</Text>
                              <FlatList
                                data = {selectedThread.comments}
                                keyExtractor={(item) => item.id}
                                renderItem={({item}) => (
                                    <View style={styles.commentItem}>
                                        <Text style={styles.commentContent}>{item.content}</Text>
                                        <Text style={styles.commentAuthor}>by {item.commenter}</Text>
                                        <Spacer height={10}/>
                                    </View>
                                )}
                                contentContainerStyle={{paddingVertical: 10}}/>
                                  </>
                          )}
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                                <TextInput
                                    style={[styles.input, { flex: 1, height: 40 }]}
                                    placeholder="Add a comment..."
                                    value={commentInput}
                                    onChangeText={setCommentInput}
                                />
                                <ThemedButton
                                    onPress={() => {
                                        addComment(selectedThread.id, commentInput);
                                        setCommentInput("");
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
              </View>
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
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 5,
  },
  filterButton: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#eee",
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonSelected: {
    backgroundColor: "#7d015c",
  },
  filterText: {
    color: "#000",
    fontSize: 14, // Optional smaller font size if too wide
  },
  title: {
    fontSize: 24,
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
    paddingHorizontal: 20
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
  filterContainerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  filterButtonsRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  newThreadButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  commentHead: {
      fontSize: 16,
  },
  commentAuthor: {
    fontSize: 12
  },
  commentItem: {
      paddingHorizontal: 20,
      borderColor: "#D3D3D3",
      borderRadius: 1
  },
  commentContent: {
      fontSize: 16
  }
});
