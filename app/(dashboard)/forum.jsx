// forum.jsx
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import { db, storage } from "../../firebaseConfig";

const categories = ["Training", "Diet", "Cardio"];

const deleteThread = async (threadId) => {
  Alert.alert("Delete Thread", "Are you sure you want to delete this thread?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          const threadDocRef = doc(db, "threads", threadId);
          const threadSnap = await getDoc(threadDocRef);
          if (!threadSnap.exists()) {
            Alert.alert("Error", "Thread not found.");
            return;
          }
          const threadData = threadSnap.data();

          if (threadData.mediaUrl) {
            try {
              const url = threadData.mediaUrl;
              const baseUrl = url.split("?")[0];
              const pathEncoded = baseUrl.split("/o/")[1];
              const path = decodeURIComponent(pathEncoded);

              const storageRef = ref(storage, path);
              await deleteObject(storageRef);
            } catch (storageErr) {
              console.warn("Failed to delete media file:", storageErr);
            }
          }

          await deleteDoc(threadDocRef);
          Alert.alert("Deleted", "Thread removed successfully.");
        } catch (error) {
          console.error("Error deleting thread: ", error);
          Alert.alert("Error", "Could not delete thread.");
        }
      },
    },
  ]);
};

const Forum = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [sortOption, setSortOption] = useState("newest");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) setCurrentUserId(user.uid);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const names = {};
      snapshot.forEach((doc) => {
        names[doc.id] = doc.data().name || "Anonymous";
      });
      setUserNames(names);
    });

    const q =
      selectedCategory === "All"
        ? query(collection(db, "threads"))
        : query(
            collection(db, "threads"),
            where("category", "==", selectedCategory),
          );

    setLoading(true);
    const unsubscribeThreads = onSnapshot(q, (snapshot) => {
      const threadsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      threadsList.sort((a, b) => {
        if (sortOption === "likes") return (b.likes || 0) - (a.likes || 0);
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });

      setThreads(threadsList);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeThreads();
    };
  }, [selectedCategory, sortOption]);

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
          onPress={() => router.push("/(forum)/addEditThread")}
          style={styles.filterButton}
        >
          <Text style={styles.filterText}>+</Text>
        </ThemedButton>
      </View>

      <DropDownPicker
        open={open}
        setOpen={setOpen}
        value={sortOption}
        setValue={setSortOption}
        items={[
          { label: "Newest", value: "newest" },
          { label: "Most Liked", value: "likes" },
        ]}
        containerStyle={{ marginTop: 10, marginBottom: 10, width: 130 }}
        zIndex={1000}
      />

      {loading ? (
        <Text>Loading threads...</Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              testID={"thread-card-button"}
              onPress={() => router.push(`/(forum)/${item.id}`)}
            >
              <ThemedView style={styles.threadCard}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.threadTitle}>{item.title}</Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginTop: 2,
                      }}
                    >
                      <Text style={styles.threadMeta}>
                        by{" "}
                        {item.authorId === currentUserId
                          ? "You"
                          : userNames[item.authorId] || "Loading..."}{" "}
                        · {item.category} ·{" "}
                      </Text>
                      <Ionicons
                        name="heart"
                        size={14}
                        color="#ff4d4d"
                        style={{ marginRight: 2 }}
                      />
                      <Text style={styles.threadMeta}>{item.likes || 0}</Text>
                    </View>

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
                        onPress={() =>
                          router.push({
                            pathname: "/(forum)/addEditThread",
                            params: { threadId: item.id },
                          })
                        }
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
    </ThemedView>
  );
};

export { deleteThread };
export default Forum;

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
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
});
