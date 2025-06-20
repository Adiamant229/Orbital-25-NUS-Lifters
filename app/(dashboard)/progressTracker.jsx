//react and expo imports
import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";

//firebase imports
import { db, auth } from "../../firebaseConfig"; 
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
} from "firebase/firestore";



const ProgressTracker = () => {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  const [selectedTab, setSelectedTab] = useState("workouts");
  const [workouts, setWorkouts] = useState([]);
  const [openedWorkouts, setOpenedWorkouts] = useState(new Set());

  const [weights, setWeights] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openYearDropdown, setOpenYearDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);

  const [weightListModalVisible, setWeightListModalVisible] = useState(false);;
  const [editingWeight, setEditingWeight] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    const uniqueYears = [
      ...new Set(
        weights.map((w) => {
          const d =
            typeof w.date === "string"
              ? new Date(w.date)
              : w.date.toDate?.() || new Date();
          return d.getFullYear();
        })
      ),
    ].sort((a, b) => b - a);

    setYearOptions(
      uniqueYears.map((year) => ({
        label: year.toString(),
        value: year,
      }))
    );

    if (!uniqueYears.includes(selectedYear)) {
      setSelectedYear(uniqueYears[0] || new Date().getFullYear());
    }
  }, [weights]);

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

  useEffect(() => {
    if (!user) {
      setWeights([]);
      return;
    }

    const weightsCollection = collection(db, "users", user.uid, "weights");
    const q = query(weightsCollection, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weightsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWeights(weightsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteWorkout = async (id) => {
    try {
      await deleteDoc(doc(db, "workouts", id));
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

  const handleWeightChange = (text) => {
    const formatted = text
      .replace(/[^0-9.]/g, "")
      .replace(/^(\d*\.\d{0,2}).*$/, "$1");
    setWeightInput(formatted);
  };

  const handleSubmitWeight = async () => {
    if (!weightInput) return;

    const weightValue = parseFloat(weightInput);
    if (isNaN(weightValue)) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      if (editingWeight) {
        const weightDocRef = doc(userDocRef, "weights", editingWeight.id);
        await updateDoc(weightDocRef, {
          weight: weightValue,
          date: date,
        });
      } else {
        const weightsCollectionRef = collection(userDocRef, "weights");
        await addDoc(weightsCollectionRef, {
          weight: weightValue,
          date: date,
        });
      }

      setModalVisible(false);
      setWeightInput("");
      setEditingWeight(null);
      fetchWeights();
    } catch (error) {
      console.error("Error submitting weight:", error);
    }
  };
  
  const fetchWeights = async () => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const weightsCollectionRef = collection(userDocRef, "weights");
      const snapshot = await getDocs(weightsCollectionRef);

      const weightList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWeights(weightList); 
    } catch (error) {
      console.error("Error fetching weights:", error);
    }
  };

  const filteredWeights = weights.filter((w) => {
    const d =
      typeof w.date === "string"
        ? new Date(w.date)
        : w.date.toDate?.() || new Date();
    return d.getFullYear() === selectedYear;
  });

  const sortedFilteredWeights = [...filteredWeights]
    .map((w) => ({
      ...w,
      date:
        typeof w.date === "string"
          ? w.date
          : w.date.toDate?.()?.toISOString()?.split("T")[0] || w.date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weightChartData = {
    labels: sortedFilteredWeights.map((entry) =>
      new Date(entry.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        data: sortedFilteredWeights.map((entry) => entry.weight),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#1e90ff",
    },
  };

  const deleteWeight = async (id) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "weights", id));
    } catch (error) {
      console.error("Failed to delete weight:", error);
      alert("Failed to delete weight");
    }
  };

  const openEditWeight = (w) => {
    setEditingWeight(w); 
    setDate(typeof w.date === "string" ? new Date(w.date) : w.date.toDate());
    setWeightInput(w.weight.toString());
    setModalVisible(true);
  };


  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Progress Tracker</ThemedText>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSelectedTab("workouts")}
          style={[
            styles.addButton,
            selectedTab === "workouts" && styles.selectedTabButton,
          ]}
        >
          <View style={styles.buttonicons}>
            <FontAwesome6 name="dumbbell" size={20} color="white" />
            <ThemedText>Workouts</ThemedText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("weight")}
          style={[
            styles.addButton,
            selectedTab === "weight" && styles.selectedTabButton,
          ]}
        >
          <View style={styles.buttonicons}>
            <Ionicons name="body" size={20} color="white" />
            <ThemedText>Bodyweight</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/exercises")}
          style={styles.addButton}
        >
          <FontAwesome5 name="book-open" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {selectedTab === "workouts" && (
        <>
          <View style={styles.header2}>
            <ThemedText style={{ fontSize: 20 }}>Your Workouts</ThemedText>
            <TouchableOpacity
              onPress={() => router.push("/addWorkout")}
              style={styles.addButton}
            >
              <ThemedText>+ New Workout</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/progression")}
              style={styles.addButton}
            >
              <Ionicons name="bar-chart" size={18} color="white" />
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

                  {(item.createdAt || item.timePeriod) && (
                    <Text style={{ color: "#555", marginTop: 4 }}>
                      {(() => {
                        if (!item.createdAt) return "";

                        const createdDate = item.createdAt.toDate();
                        const now = new Date();
                        const diffTime = Math.abs(now - createdDate);
                        const diffDays = Math.floor(
                          diffTime / (1000 * 60 * 60 * 24)
                        );

                        const dateStr = createdDate.toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        );

                        const timePeriodStr = item.timePeriod
                          ? ` ${item.timePeriod} Workout`
                          : " Workout";
                        const relativeStr =
                          diffDays === 0
                            ? "Today"
                            : diffDays === 1
                            ? "1 day ago"
                            : `${diffDays} days ago`;

                        return `${dateStr}${timePeriodStr} (${relativeStr})`;
                      })()}
                    </Text>
                  )}

                  {isSelected && (
                    <View style={{ marginTop: 8 }}>
                      {item.workoutNotes && item.workoutNotes.trim() !== "" && (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: "bold" }}>Notes:</Text>
                          <Text style={styles.notesText}>
                            {item.workoutNotes}
                          </Text>
                        </View>
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
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => {
                            router.push({
                              pathname: "/addWorkout",
                              params: { editWorkoutId: item.id },
                            });
                          }}
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={20}
                            color="#007AFF"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteWorkout(item.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ff3b30"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {selectedTab === "weight" && (
        <>
          <View style={styles.header3}>
            <ThemedText style={{ fontSize: 20 }}>Your Bodyweights</ThemedText>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addButton}
            >
              <ThemedText>+ New Weight</ThemedText>
            </TouchableOpacity>

            <DropDownPicker
              open={openYearDropdown}
              value={selectedYear}
              items={yearOptions}
              setOpen={setOpenYearDropdown}
              setValue={setSelectedYear}
              setItems={setYearOptions}
              containerStyle={{ width: 150 }}
              placeholder="Select Year"
            />
          </View>

          <View style={styles.summaryContainer}>
            {sortedFilteredWeights.length > 0 ? (
              <TouchableOpacity onPress={() => setWeightListModalVisible(true)}>
                <LineChart
                  data={weightChartData}
                  width={screenWidth - 30}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    borderRadius: 16,
                  }}
                />
              </TouchableOpacity>
            ) : (
              <Text style={styles.graphPlaceholder}>
                No weight data for {selectedYear}
              </Text>
            )}
          </View>
        </>
      )}
      <Modal
        visible={weightListModalVisible}
        animationType="fade"
        onRequestClose={() => setWeightListModalVisible(false)}
        transparent={true}
      >
        <TouchableWithoutFeedback
          onPress={() => setWeightListModalVisible(false)}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.weightModalContainer}>
          <ThemedText style={styles.modalTitle}>Weight Entries</ThemedText>

          {weights.length === 0 ? (
            <ThemedText style={{ color: "#ccc" }}>
              No weight entries found.
            </ThemedText>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {weights.map((w) => {
                const wDate =
                  typeof w.date === "string"
                    ? w.date
                    : w.date.toDate?.()?.toISOString()?.split("T")[0] || "";

                return (
                  <View key={w.id} style={styles.weightEntryRow}>
                    <ThemedText style={styles.weightEntryText}>
                      {wDate} - {w.weight} kg
                    </ThemedText>
                    <View style={styles.weightEntryButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          openEditWeight(w);
                          setWeightListModalVisible(false);
                          setModalVisible(true);
                        }}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteWeight(w.id)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff3b30"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%" }}
            >
              <View style={styles.modalContent}>
                <ThemedText style={styles.modalTitle}>
                  {editingWeight ? "Edit Weight Entry" : "Add New Weight"}
                </ThemedText>

                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={{ color: "#eee" }}>
                    Select Date: {date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Enter weight (kg)"
                  value={weightInput}
                  onChangeText={handleWeightChange}
                  keyboardType="numeric"
                  placeholderTextColor="grey"
                />

                <View style={styles.modalButtonRow}>
                  <ThemedButton onPress={handleSubmitWeight}>
                    <ThemedText>Save</ThemedText>
                  </ThemedButton>

                  <ThemedButton
                    onPress={() => {
                      setModalVisible(false);
                      setEditingWeight(null); // reset editing state
                      setWeightInput("");
                    }}
                  >
                    <ThemedText>Cancel</ThemedText>
                  </ThemedButton>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
};

export default ProgressTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    paddingTop: 70,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 30,
    marginTop: 15,
  },
  header2: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    marginBottom: 5,
  },
  header3: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginBottom: 5,
  },
  buttonicons: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#2196f3",
    borderRadius: 20,
    padding: 10,
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
  summaryContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  graphPlaceholder: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  datePickerButton: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  selectedTabButton: {
    backgroundColor: "#7d015c",
  },
  weightModalContainer: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  weightEntryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  weightEntryText: {
    color: "#fff",
    fontSize: 16,
  },
  weightEntryButtons: {
    flexDirection: "row",
    gap: 10,
  },
});
