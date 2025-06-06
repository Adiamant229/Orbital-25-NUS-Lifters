import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";

import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { fontSize } from "@mui/system";

const ProgressTracker = () => {
  const router = useRouter();

  const [workouts, setWorkouts] = useState([]);
  const [openedWorkouts, setOpenedWorkouts] = useState(new Set());

  useEffect(() => {
    const q = query(collection(db, "workouts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkouts(workoutsData);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteWorkout = async (id) => {
    try {
      await deleteDoc(doc(db, "workouts", id));
      // Optionally close the card after deletion
      setOpenedWorkouts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to delete workout:", error);
      alert("Failed to delete workout");
    }
  };

  const toggleWorkout = (id) => {
    setOpenedWorkouts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Your Workouts</ThemedText>
        <TouchableOpacity
          onPress={() => router.push("/addWorkout")}
          style={styles.addButton}
        >
          <ThemedText>+</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/exercises")}
          style={styles.addButton}
        >
          <ThemedText>Gym Info and Guide</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = openedWorkouts.has(item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleWorkout(item.id)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>

              {isSelected && (
                <View style={{ marginTop: 8 }}>
                  {item.createdAt && (
                    <Text style={{ fontStyle: "italic", marginBottom: 8 }}>
                      Date: {item.createdAt.toDate().toLocaleString()}
                    </Text>
                  )}
                  {item.exercises?.map((ex, i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text style={{ fontWeight: "bold" }}>{ex.name}</Text>
                      {ex.sets.map((set, j) => (
                        <Text key={j} style={{ marginLeft: 10 }}>
                          Set {j + 1}: {set.reps} reps @ {set.weight} kg
                        </Text>
                      ))}
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={() => handleDeleteWorkout(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete Workout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </ThemedView>
  );
};

export default ProgressTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    paddingTop: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#2196f3",
    borderRadius: 20,
    padding: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: "red",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});