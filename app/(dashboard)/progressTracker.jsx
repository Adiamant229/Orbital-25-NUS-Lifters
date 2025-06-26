//react and expo imports
import { useState, useEffect } from "react";
import {
  Alert,
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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";

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
  where,
  Timestamp, // <--- Import Timestamp here so your component can access the mocked version
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

  // For weights - REVERTED TO ORIGINAL LOGIC, PLUS FIX FOR YEAR OPTIONS
  const [openYearDropdown, setOpenYearDropdown] = useState(false);
  // Initial selectedYear set to null, will be updated by effect
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);
  const [allWeights, setAllWeights] = useState([]); // State to hold all weights for year dropdown

  const [openWorkoutYearDropdown, setOpenWorkoutYearDropdown] = useState(false);
  const [selectedWorkoutYear, setSelectedWorkoutYear] = useState("all");
  const [workoutYearOptions, setWorkoutYearOptions] = useState([]);

  const [weightListModalVisible, setWeightListModalVisible] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const user = auth.currentUser; // Get the current user

  const [allWorkouts, setAllWorkouts] = useState([]); // For generating workout year dropdown

  // NEW STATE: To track original values for edit mode comparison
  const [originalWeightInput, setOriginalWeightInput] = useState("");
  const [originalDate, setOriginalDate] = useState(new Date());

  // NEW: Effect to fetch ALL weights for year dropdown generation (unfiltered)
  useEffect(() => {
    if (!user) {
      setAllWeights([]);
      return;
    }

    const weightsCollection = collection(db, "users", user.uid, "weights");
    const q = query(weightsCollection, orderBy("date", "desc")); // Order by date to get recent years easily

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllWeights(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Effect to populate year options for weights - NOW uses allWeights, no default current year
  useEffect(() => {
    if (allWeights.length === 0) {
      setYearOptions([]);
      setSelectedYear(null); // No year selected if no data
      return;
    }

    const uniqueYears = [
      ...new Set(
        allWeights.map((w) => {
          // This line is the focus of the error
          const d =
            typeof w.date === "string"
              ? new Date(w.date)
              : w.date.toDate?.() || new Date(); // w.date.toDate() will now be defined due to mock
          return d.getFullYear();
        })
      ),
    ].sort((a, b) => b - a); // Sort descending for most recent year first

    const options = uniqueYears.map((year) => ({
      label: year.toString(),
      value: year,
    }));
    setYearOptions(options);

    // If selectedYear is null or not in the new options, default to the most recent year available
    if (selectedYear === null || !uniqueYears.includes(selectedYear)) {
      setSelectedYear(uniqueYears[0]);
    }
  }, [allWeights, selectedYear]); // Dependency on allWeights and selectedYear

  // Effect to fetch ALL workouts for year dropdown generation (unfiltered) - REMAINS
  useEffect(() => {
    if (!user) {
      setAllWorkouts([]);
      return;
    }

    const q = query(
      collection(db, "workouts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllWorkouts(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Effect to populate year options for workouts (uses allWorkouts) - REMAINS
  useEffect(() => {
    if (!user || allWorkouts.length === 0) {
      setWorkoutYearOptions([{ label: "All", value: "all" }]);
      setSelectedWorkoutYear("all");
      return;
    }

    const uniqueWorkoutYears = [
      ...new Set(
        allWorkouts.map((w) => {
          const d = w.createdAt?.toDate ? w.createdAt.toDate() : new Date();
          return d.getFullYear();
        })
      ),
    ].sort((a, b) => b - a);

    const options = [
      { label: "All", value: "all" },
      ...uniqueWorkoutYears.map((year) => ({
        label: year.toString(),
        value: year,
      })),
    ];

    setWorkoutYearOptions(options);

    if (
      selectedWorkoutYear !== "all" &&
      !uniqueWorkoutYears.includes(selectedWorkoutYear) &&
      uniqueWorkoutYears.length > 0
    ) {
      setSelectedWorkoutYear(uniqueWorkoutYears[0]);
    } else if (uniqueWorkoutYears.length === 0) {
      setSelectedWorkoutYear("all");
    }
  }, [allWorkouts, user]);

  // Effect to fetch workouts based on selectedWorkoutYear (filters from Firebase) - REMAINS
  useEffect(() => {
    if (!user) {
      setWorkouts([]);
      return;
    }

    let q;
    const workoutsCollectionRef = collection(db, "workouts");

    if (selectedWorkoutYear === "all") {
      q = query(
        workoutsCollectionRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      const startOfYear = new Date(selectedWorkoutYear, 0, 1);
      const endOfYear = new Date(selectedWorkoutYear + 1, 0, 1);

      q = query(
        workoutsCollectionRef,
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfYear),
        where("createdAt", "<", endOfYear),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkouts(workoutsData);
    });

    return () => unsubscribe();
  }, [user, selectedWorkoutYear]);

  // Effect to fetch weights (filters by selectedYear for the graph/list display)
  useEffect(() => {
    if (!user || selectedYear === null) {
      setWeights([]); // Clear weights if no year is selected (no data)
      return;
    }

    const weightsCollection = collection(db, "users", user.uid, "weights");

    // Calculate start and end of the selected year for the query
    const startOfYear = new Date(selectedYear, 0, 1); // January 1st of the selected year
    const endOfYear = new Date(selectedYear + 1, 0, 1); // January 1st of the *next* year

    const q = query(
      weightsCollection,
      where("date", ">=", startOfYear), // Filter documents created on or after startOfYear
      where("date", "<", endOfYear), // Filter documents created before endOfYear
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weightsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWeights(weightsData);
    });

    return () => unsubscribe();
  }, [user, selectedYear]); // Re-run effect when user or selectedYear changes

  const handleDeleteWorkout = (id) => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (user) {
                await deleteDoc(doc(db, "workouts", id));
                setOpenedWorkouts((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(id);
                  return newSet;
                });
              } else {
                alert("You must be logged in to delete workouts.");
              }
            } catch (error) {
              console.error("Failed to delete workout:", error);
              alert("Failed to delete workout");
            }
          },
        },
      ]
    );
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
    if (!weightInput) {
      alert("Please enter your weight");
      return;
    }

    const weightValue = parseFloat(weightInput);

    if (isNaN(weightValue)) {
      alert("Enter a numerical weight");
      return;
    }

    const submit = async () => {
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
        setDate(new Date());
        setEditingWeight(null);
        setOriginalWeightInput(""); // Reset original values on successful submission
        setOriginalDate(new Date()); // Reset original values on successful submission
      } catch (error) {
        console.error("Error submitting weight:", error);
        alert("Failed to submit weight.");
      }
    };

    Alert.alert(
      editingWeight ? "Update Weight" : "Submit Weight",
      editingWeight
        ? "Are you sure you want to update this weight entry?"
        : "Are you sure you want to submit this weight entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: editingWeight ? "Update" : "Submit",
          style: "cancel",
          onPress: submit,
        },
      ]
    );
  };

  // filteredWeights now refers to the `weights` state which is already filtered by selectedYear
  const filteredWeights = weights;

  const sortedFilteredWeightsForChart = [...filteredWeights]
    .map((w) => ({
      ...w,
      date:
        typeof w.date === "string"
          ? w.date
          : w.date.toDate?.()?.toISOString()?.split("T")[0] || w.date,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const sortedFilteredWeightsForList = [...filteredWeights]
    .map((w) => ({
      ...w,
      date:
        typeof w.date === "string"
          ? w.date
          : w.date.toDate?.()?.toISOString()?.split("T")[0] || w.date,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const weightChartData = {
    labels: sortedFilteredWeightsForChart.map((entry) =>
      new Date(entry.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        data: sortedFilteredWeightsForChart.map((entry) => entry.weight),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#2c2c2c", // Dark background start
    backgroundGradientTo: "#1c1c1c", // Dark background end
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Vibrant blue line
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#007AFF",
      fill: "#FFFFFF",
    },
    propsForVerticalLabels: {
      fontSize: 10,
      fontWeight: "bold",
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fontWeight: "bold",
    },
    strokeWidth: 2,
    propsForBackgroundLines: {
      strokeDasharray: "0",
      stroke: "#444444",
    },
    barPercentage: 0,
    categoryPercentage: 0,
  };

  const handleDeleteWeight = (id) => {
    Alert.alert(
      "Delete Weight",
      "Are you sure you want to delete this weight entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", user.uid, "weights", id));
            } catch (error) {
              console.error("Failed to delete weight:", error);
              alert("Failed to delete weight");
            }
          },
        },
      ]
    );
  };

  const openEditWeight = (w) => {
    setEditingWeight(w);
    const initialDate =
      typeof w.date === "string" ? new Date(w.date) : w.date.toDate();
    setDate(initialDate);
    setOriginalDate(initialDate); // Set original date for comparison
    setWeightInput(w.weight.toString());
    setOriginalWeightInput(w.weight.toString()); // Set original weight input for comparison
    setModalVisible(true);
  };

  const handleCancelWeightEntry = () => {
    // Check for changes based on whether it's an edit or new entry
    let hasChanges = false;
    if (editingWeight) {
      // Editing an existing entry
      const weightChanged = weightInput !== originalWeightInput;
      const dateChanged = date.toDateString() !== originalDate.toDateString(); // Compare dates ignoring time
      hasChanges = weightChanged || dateChanged;
    } else {
      // New entry
      hasChanges = weightInput.length > 0;
    }

    if (hasChanges) {
      Alert.alert(
        editingWeight ? "Unsaved Changes" : "Discard Entry",
        editingWeight
          ? "You have unsaved changes. Are you sure you want to discard them?"
          : "Are you sure you want to discard this new weight entry?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: () => {
              setModalVisible(false);
              setEditingWeight(null);
              setWeightInput("");
              setDate(new Date());
              setOriginalWeightInput(""); // Reset original values
              setOriginalDate(new Date()); // Reset original values
            },
          },
        ]
      );
    } else {
      // No changes, just close the modal
      setModalVisible(false);
      setEditingWeight(null);
      setWeightInput("");
      setDate(new Date());
      setOriginalWeightInput(""); // Reset original values
      setOriginalDate(new Date()); // Reset original values
    }
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
          onPress={() => setSelectedTab("diet")}
          style={[
            styles.addButton,
            selectedTab === "diet" && styles.selectedTabButton,
          ]}
        >
          <View style={styles.buttonicons}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={24}
              color="white"
            />
            <ThemedText>Diet</ThemedText>
          </View>
        </TouchableOpacity>
      </View>

      {selectedTab === "workouts" && (
        <>
          <View style={styles.header2}>
            <ThemedText style={{ fontSize: 20 }}>Your Workouts</ThemedText>

            <TouchableOpacity
              onPress={() => router.push("/addWorkout")}
              style={styles.addButton2}
            >
              <ThemedText>+ New Workout</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              testID="exerciseProgress-button"
              onPress={() => router.push("/exerciseProgress")}
              style={styles.addButton2}
            >
              <Ionicons name="bar-chart" size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              testID="exercises-button"
              onPress={() => router.push("/exercises")}
              style={styles.addButton2}
            >
              <FontAwesome5 name="book-open" size={20} color="white" />
            </TouchableOpacity>

            {/* DropDownPicker for Workout Year Filter */}
            <DropDownPicker
              open={openWorkoutYearDropdown}
              value={selectedWorkoutYear}
              items={workoutYearOptions}
              setOpen={setOpenWorkoutYearDropdown}
              setValue={setSelectedWorkoutYear}
              setItems={setWorkoutYearOptions}
              placeholder="Select Year"
              listMode="SCROLLVIEW"
              dropDownDirection="BOTTOM"
              maxHeight={200}
              containerStyle={{
                width: 100,
                zIndex: 1000,
              }}
              style={{
                height: 50,
                backgroundColor: "#2c2c2c",
                borderColor: "#444444",
              }}
              dropDownContainerStyle={{
                backgroundColor: "#2c2c2c",
                borderColor: "#444444",
              }}
              textStyle={{
                color: "#fff",
              }}
              labelStyle={{
                color: "#fff",
              }}
              selectedItemLabelStyle={{
                fontWeight: "bold",
              }}
              arrowIconStyle={{
                tintColor: "#fff",
              }}
              tickIconStyle={{
                tintColor: "#fff",
              }}
            />
          </View>

          {workouts.length === 0 ? (
            <Text style={styles.graphPlaceholder}>
              {allWorkouts.length === 0
                ? "No workout data available. Add an entry to get started!"
                : `No workout data for ${selectedWorkoutYear}.`}
            </Text>
          ) : (
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
                        {item.workoutNotes &&
                          item.workoutNotes.trim() !== "" && (
                            <View style={{ marginBottom: 8 }}>
                              <Text style={{ fontWeight: "bold" }}>Notes:</Text>
                              <Text style={styles.notesText}>
                                {item.workoutNotes}
                              </Text>
                            </View>
                          )}

                        {item.exercises?.map((ex, i) => (
                          <View key={i} style={{ marginBottom: 8 }}>
                            <Text style={{ fontWeight: "bold" }}>
                              {ex.name}
                            </Text>
                            {ex.sets.map((set, j) => (
                              <Text key={j} style={{ marginLeft: 10 }}>
                                Set {j + 1}: {set.reps} reps @ {set.weight} kg
                              </Text>
                            ))}
                          </View>
                        ))}

                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <TouchableOpacity
                            testID={`edit-button-${item.id}`}
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
                            testID={`delete-button-${item.id}`}
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
          )}
        </>
      )}

      {selectedTab === "diet" && (
        <>
          <View style={styles.header2}>
            <ThemedText style={{ fontSize: 20 }}>Your Meals</ThemedText>
            <TouchableOpacity
              onPress={() => router.push("/macro")}
              style={styles.addButton2}
            >
              <ThemedText>+ New Meal</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/progression")}
              style={styles.addButton2}
            >
              <Ionicons name="bar-chart" size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/exercises")}
              style={styles.addButton2}
            >
              <FontAwesome5 name="book-open" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {selectedTab === "weight" && (
        <>
          <View style={styles.header3}>
            <ThemedText style={{ fontSize: 20 }}>Your Bodyweights</ThemedText>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
                setEditingWeight(null);
                setWeightInput("");
                setDate(new Date());
                setOriginalWeightInput(""); // Reset original for new entry
                setOriginalDate(new Date()); // Reset original for new entry
              }}
              style={styles.addButton2}
            >
              <ThemedText>+ New Weight</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/exercises")}
              style={styles.addButton2}
            >
              <FontAwesome5 name="book-open" size={20} color="white" />
            </TouchableOpacity>

            <DropDownPicker
              open={openYearDropdown}
              value={selectedYear}
              items={yearOptions}
              setOpen={setOpenYearDropdown}
              setValue={setSelectedYear}
              setItems={setYearOptions}
              containerStyle={{ width: 100 }}
              placeholder="Select Year"
              listMode={"SCROLLVIEW"}
              dropDownDirection="BOTTOM"
              maxHeight={200}
              style={{
                backgroundColor: "#2c2c2c",
                borderColor: "#444444",
              }}
              textStyle={{
                color: "#fff",
              }}
              labelStyle={{
                color: "#fff",
              }}
              arrowIconStyle={{
                tintColor: "#fff",
              }}
              tickIconStyle={{
                tintColor: "#fff",
              }}
              selectedItemLabelStyle={{
                fontWeight: "bold",
              }}
              dropDownContainerStyle={{
                backgroundColor: "#2c2c2c",
                borderColor: "#444444",
              }}
            />
          </View>

          <View style={styles.summaryContainer}>
            {selectedYear === null ? (
              <Text style={styles.graphPlaceholder}>
                No weight data available. Add an entry to get started!
              </Text>
            ) : sortedFilteredWeightsForChart.length > 0 ? (
              <TouchableOpacity
                testID="bodyweight-graph"
                onPress={() => setWeightListModalVisible(true)}
              >
                <LineChart
                  data={weightChartData}
                  width={screenWidth - 30}
                  height={220}
                  chartConfig={chartConfig}
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

          {sortedFilteredWeightsForList.length === 0 ? (
            <ThemedText style={{ color: "#ccc" }}>
              No weight entries found for {selectedYear || "this period"}.
            </ThemedText>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {sortedFilteredWeightsForList.map((w) => {
                const wDate = new Date(w.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <View key={w.id} style={styles.weightEntryRow}>
                    <ThemedText style={styles.weightEntryText}>
                      {wDate} - {w.weight} kg
                    </ThemedText>
                    <View style={styles.weightEntryButtons}>
                      <TouchableOpacity
                        testID={`edit-weight-${w.id}`}
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
                      <TouchableOpacity
                        onPress={() => handleDeleteWeight(w.id)}
                      >
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
                  <ThemedButton
                    onPress={handleSubmitWeight}
                    testID="saveWeightButton"
                  >
                    <ThemedText>{editingWeight ? "Save" : "Submit"}</ThemedText>
                  </ThemedButton>

                  <ThemedButton onPress={handleCancelWeightEntry}>
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
    paddingTop: Platform.OS === "ios" ? 70 : 30,
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
    justifyContent: "center",
  },
  header2: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginBottom: 5,
    flexWrap: "wrap",
  },
  header3: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
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
    width: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton2: {
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
  notesText: {
    color: "#444",
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
