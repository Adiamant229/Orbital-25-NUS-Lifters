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
  SafeAreaView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";

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
  getDocs,
} from "firebase/firestore";

const ProgressTracker = () => {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const user = auth.currentUser;

  const [selectedTab, setSelectedTab] = useState("workouts");
  const [workouts, setWorkouts] = useState([]);
  const [openWorkoutYearDropdown, setOpenWorkoutYearDropdown] = useState(false);
  const [selectedWorkoutYear, setSelectedWorkoutYear] = useState("all");
  const [workoutYearOptions, setWorkoutYearOptions] = useState([]);
  const [openedWorkouts, setOpenedWorkouts] = useState(new Set());
  const [allWorkouts, setAllWorkouts] = useState([]);

  const [weights, setWeights] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openYearDropdown, setOpenYearDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);
  const [allWeights, setAllWeights] = useState([]);
  const [weightListModalVisible, setWeightListModalVisible] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const [originalWeightInput, setOriginalWeightInput] = useState("");
  const [originalDate, setOriginalDate] = useState(new Date());

  const [macroModalVisible, setMacroModalVisible] = useState(false);
  const [macroTitle, setMacroTitle] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [macroSelectorDate, setMacroSelectorDate] = useState(new Date());
  const [macros, setMacros] = useState([]);
  const [allMacros, setAllMacros] = useState([]);
  const [openedMacros, setOpenedMacros] = useState(new Set());
  const [macroYearOptions, setMacroYearOptions] = useState([]);
  const [selectedMacroYear, setSelectedMacroYear] = useState("all");
  const [openMacroYearDropdown, setOpenMacroYearDropdown] = useState(false);
  const [editingMacro, setEditingMacro] = useState(null);
  const [originalMacroTitle, setOriginalMacroTitle] = useState("");
  const [originalCalories, setOriginalCalories] = useState("");
  const [originalProtein, setOriginalProtein] = useState("");
  const [originalCarbs, setOriginalCarbs] = useState("");
  const [originalFats, setOriginalFats] = useState("");
  const [macroDate, setMacroDate] = useState(new Date());
  const [showMacroDatePicker, setShowMacroDatePicker] = useState(false);

  useEffect(() => {
    if (!user) {
      setAllMacros([]);
      setMacros([]);
      setAllWorkouts([]);
      setAllWeights([]);
      return;
    }

    const queryWeightData = query(
      collection(db, "users", user.uid, "weights"),
      orderBy("date", "desc"),
    );

    const unsubscribeWeight = onSnapshot(queryWeightData, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllWeights(data);
    });
    const queryWorkoutData = query(
      collection(db, "workouts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribeWork = onSnapshot(queryWorkoutData, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllWorkouts(data);
    });

    const queryMacroData = query(
      collection(db, "users", user.uid, "macros"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribeMacs = onSnapshot(queryMacroData, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllMacros(data);
    });

    return () => {
      unsubscribeWeight();
      unsubscribeWork();
      unsubscribeMacs();
    };
  }, [user]);

  useEffect(() => {
    if (!user || allMacros.length === 0) {
      setMacroYearOptions([{ label: "All", value: "all" }]);
      setSelectedMacroYear("all");
      return;
    }

    const uniqueYears = [
      ...new Set(
        allMacros.map((m) => {
          const d = m.createdAt?.toDate?.() || new Date();
          return d.getFullYear();
        }),
      ),
    ].sort((a, b) => b - a);

    const options = [
      { label: "All", value: "all" },
      ...uniqueYears.map((year) => ({
        label: year.toString(),
        value: year,
      })),
    ];

    setMacroYearOptions(options);

    if (
      selectedMacroYear !== "all" &&
      !uniqueYears.includes(selectedMacroYear) &&
      uniqueYears.length > 0
    ) {
      setSelectedMacroYear(uniqueYears[0]);
    } else if (uniqueYears.length === 0) {
      setSelectedMacroYear("all");
    }
  }, [allMacros, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const macrosRef = collection(db, "users", user.uid, "macros");
    let q;

    if (selectedMacroYear === "all") {
      q = query(macrosRef, orderBy("createdAt", "desc"));
    } else {
      const startOfYear = new Date(selectedMacroYear, 0, 1);
      const endOfYear = new Date(selectedMacroYear + 1, 0, 1);

      q = query(
        macrosRef,
        where("createdAt", ">=", startOfYear),
        where("createdAt", "<", endOfYear),
        orderBy("createdAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMacros(data);
    });

    return () => unsubscribe();
  }, [user, selectedMacroYear]);

  const toggleMacro = (id) => {
    setOpenedMacros((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    if (allWeights.length === 0) {
      setYearOptions([]);
      setSelectedYear(null);
      return;
    }

    const uniqueYears = [
      ...new Set(
        allWeights.map((w) => {
          const d =
            typeof w.date === "string"
              ? new Date(w.date)
              : w.date.toDate?.() || new Date();
          return d.getFullYear();
        }),
      ),
    ].sort((a, b) => b - a);
    const options = uniqueYears.map((year) => ({
      label: year.toString(),
      value: year,
    }));
    setYearOptions(options);

    if (selectedYear === null || !uniqueYears.includes(selectedYear)) {
      setSelectedYear(uniqueYears[0]);
    }
  }, [allWeights, selectedYear]);

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
        }),
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
        orderBy("createdAt", "desc"),
      );
    } else {
      const startOfYear = new Date(selectedWorkoutYear, 0, 1);
      const endOfYear = new Date(selectedWorkoutYear + 1, 0, 1);

      q = query(
        workoutsCollectionRef,
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfYear),
        where("createdAt", "<", endOfYear),
        orderBy("createdAt", "desc"),
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

  useEffect(() => {
    if (!user || selectedYear === null) {
      setWeights([]);
      return;
    }

    const weightsCollection = collection(db, "users", user.uid, "weights");

    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear + 1, 0, 1);

    const q = query(
      weightsCollection,
      where("date", ">=", startOfYear),
      where("date", "<", endOfYear),
      orderBy("date", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weightsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWeights(weightsData);
    });

    return () => unsubscribe();
  }, [user, selectedYear]);

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
                Alert.alert("You must be logged in to delete workouts.");
              }
            } catch (error) {
              console.error("Failed to delete workout:", error);
              Alert.alert("Failed to delete workout");
            }
          },
        },
      ],
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
      Alert.alert("Please enter your weight");
      return;
    }

    const weightValue = parseFloat(weightInput);

    if (isNaN(weightValue)) {
      Alert.alert("Enter a numerical weight");
      return;
    }

    const submit = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const weightsCollectionRef = collection(userDocRef, "weights");

        const selectedDateNormalized = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );

        const q = query(
          weightsCollectionRef,
          where("date", ">=", selectedDateNormalized),
          where(
            "date",
            "<",
            new Date(selectedDateNormalized.getTime() + 24 * 60 * 60 * 1000),
          ),
          orderBy("date", "desc"),
        );

        const snapshot = await getDocs(q);
        const existingWeightsOnDate = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (editingWeight) {
          const weightDocRef = doc(userDocRef, "weights", editingWeight.id);
          await updateDoc(weightDocRef, {
            weight: weightValue,
            date: date,
          });
        } else {
          await addDoc(weightsCollectionRef, {
            weight: weightValue,
            date: date,
          });
        }

        const updatedSnapshot = await getDocs(q);
        const allCurrentDayWeights = updatedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        }));

        if (allCurrentDayWeights.length > 1) {
          allCurrentDayWeights.sort(
            (a, b) => b.date.getTime() - a.date.getTime(),
          );
          const latestEntry = allCurrentDayWeights[0];

          for (let i = 1; i < allCurrentDayWeights.length; i++) {
            await deleteDoc(
              doc(userDocRef, "weights", allCurrentDayWeights[i].id),
            );
          }
        }

        setModalVisible(false);
        setWeightInput("");
        setDate(new Date());
        setEditingWeight(null);
        setOriginalWeightInput("");
        setOriginalDate(new Date());
      } catch (error) {
        console.error("Error submitting weight:", error);
        Alert.alert("Failed to submit weight.");
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
          style: "default",
          onPress: submit,
        },
      ],
    );
  };

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
      }),
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
    backgroundGradientFrom: "#2c2c2c",
    backgroundGradientTo: "#1c1c1c",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
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
              Alert.alert("Failed to delete weight");
            }
          },
        },
      ],
    );
  };

  const openEditWeight = (w) => {
    setEditingWeight(w);
    const initialDate =
      typeof w.date === "string" ? new Date(w.date) : w.date.toDate();
    setDate(initialDate);
    setOriginalDate(initialDate);
    setWeightInput(w.weight.toString());
    setOriginalWeightInput(w.weight.toString());
    setModalVisible(true);
  };

  const handleCancelWeightEntry = () => {
    let hasChanges = false;
    if (editingWeight) {
      const weightChanged = weightInput !== originalWeightInput;
      const dateChanged = date.toDateString() !== originalDate.toDateString();
      hasChanges = weightChanged || dateChanged;
    } else {
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
              setOriginalWeightInput("");
              setOriginalDate(new Date());
            },
          },
        ],
      );
    } else {
      setModalVisible(false);
      setEditingWeight(null);
      setWeightInput("");
      setDate(new Date());
      setOriginalWeightInput("");
      setOriginalDate(new Date());
    }
  };

  const handleSubmitMacros = async () => {
    if (!macroTitle || !calories || !protein || !carbs || !fats) {
      Alert.alert("Please fill in all fields.");
      return;
    }

    const caloriesVal = parseInt(calories);
    const proteinVal = parseInt(protein);
    const carbsVal = parseInt(carbs);
    const fatsVal = parseInt(fats);

    if ([caloriesVal, proteinVal, carbsVal, fatsVal].some(isNaN)) {
      Alert.alert("All macros must be numeric values.");
      return;
    }

    const submit = async () => {
      try {
        const macrosRef = collection(db, "users", user.uid, "macros");

        if (editingMacro) {
          const macroDocRef = doc(macrosRef, editingMacro.id);
          await updateDoc(macroDocRef, {
            title: macroTitle,
            createdAt: macroDate,
            calories: caloriesVal,
            protein: proteinVal,
            carbs: carbsVal,
            fats: fatsVal,
          });
        } else {
          await addDoc(macrosRef, {
            title: macroTitle,
            createdAt: macroDate,
            calories: caloriesVal,
            protein: proteinVal,
            carbs: carbsVal,
            fats: fatsVal,
          });
        }

        setMacroModalVisible(false);
        setMacroTitle("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFats("");
        setEditingMacro(null);
      } catch (error) {
        console.error("Error saving macro entry:", error);
        Alert.alert("Failed to save macro entry.");
      }
    };

    Alert.alert(
      editingMacro ? "Update Macros" : "Submit Macros",
      editingMacro
        ? "Are you sure you want to update this macro entry?"
        : "Are you sure you want to submit this macro entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: editingMacro ? "Update" : "Submit",
          style: "default",
          onPress: submit,
        },
      ],
    );
  };

  const openEditMacro = (macro) => {
    setEditingMacro(macro);
    setMacroTitle(macro.title);
    setCalories(macro.calories.toString());
    setProtein(macro.protein.toString());
    setCarbs(macro.carbs.toString());
    setFats(macro.fats.toString());

    setOriginalMacroTitle(macro.title);
    setOriginalCalories(macro.calories.toString());
    setOriginalProtein(macro.protein.toString());
    setOriginalCarbs(macro.carbs.toString());
    setOriginalFats(macro.fats.toString());

    setMacroModalVisible(true);
  };

  const handleDeleteMacro = (id) => {
    Alert.alert(
      "Delete Macro Entry",
      "Are you sure you want to delete this macro entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", user.uid, "macros", id));

              setImportedMacroHandled(true);

              setMacroModalVisible(false);
              setEditingMacro(null);

              router.replace("/(dashboard)/progressTracker");
            } catch (error) {
              console.error("Failed to delete macro entry:", error);
              Alert.alert("Failed to delete macro entry");
            }
          },
        },
      ],
    );
  };

  const handleCancelMacroEntry = () => {
    const hasChanges =
      macroTitle !== originalMacroTitle ||
      calories !== originalCalories ||
      protein !== originalProtein ||
      carbs !== originalCarbs ||
      fats !== originalFats;

    if (hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: () => {
              setMacroModalVisible(false);
              setEditingMacro(null);
              setMacroTitle("");
              setCalories("");
              setProtein("");
              setCarbs("");
              setFats("");
              setImportedMacroHandled(false);
            },
          },
        ],
      );
    } else {
      setMacroModalVisible(false);
      setEditingMacro(null);
      setMacroTitle("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setImportedMacroHandled(false);
    }
  };

  const {
    importedMacro,
    importedSelectedTab,
    importedCalories,
    importedProtein,
    importedFat,
    importedCarbs,
  } = useLocalSearchParams();
  const [importedMacroHandled, setImportedMacroHandled] = useState(false);

  useEffect(() => {
    if (importedMacro === "true" && importedMacroHandled) {
      setImportedMacroHandled(false);
    }

    if (!importedMacroHandled && importedMacro === "true") {
      if (importedSelectedTab === "Macros") {
        setSelectedTab("Macros");
      }

      setCalories(importedCalories || "");
      setProtein(importedProtein || "");
      setFats(importedFat || "");
      setCarbs(importedCarbs || "");
      setMacroDate(new Date());
      setMacroModalVisible(true);
      setImportedMacroHandled(true);

      router.replace("/(dashboard)/progressTracker");
    }
  }, [
    importedMacro,
    importedSelectedTab,
    importedCalories,
    importedProtein,
    importedFat,
    importedCarbs,
    importedMacroHandled,
  ]);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setMacroSelectorDate(newDate);
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
            <ThemedText style={{ color: "white" }}>Workouts</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab("Macros")}
          style={[
            styles.addButton,
            selectedTab === "Macros" && styles.selectedTabButton,
          ]}
        >
          <View style={styles.buttonicons}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={24}
              color="white"
            />
            <ThemedText style={{ color: "white" }}>Macros</ThemedText>
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
            <ThemedText style={{ color: "white" }}>Bodyweight</ThemedText>
          </View>
        </TouchableOpacity>
      </View>
      {selectedTab === "workouts" && (
        <>
          <View style={styles.header2}>
            <ThemedText style={{ fontSize: 17 }}>Your Workouts</ThemedText>

            <TouchableOpacity
              onPress={() => router.push("/addWorkout")}
              style={styles.addButton2}
            >
              <ThemedText style={{ color: "white" }}>+</ThemedText>
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
              <FontAwesome5 name="book-open" size={15} color="white" />
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

                          function calendarDaysDiff(d1, d2) {
                            const date1 = new Date(
                              d1.getFullYear(),
                              d1.getMonth(),
                              d1.getDate(),
                            );
                            const date2 = new Date(
                              d2.getFullYear(),
                              d2.getMonth(),
                              d2.getDate(),
                            );
                            const diffTime = date2.getTime() - date1.getTime();
                            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
                          }

                          const diffDays = calendarDaysDiff(createdDate, now);

                          const dateStr = createdDate.toLocaleDateString(
                            undefined,
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
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

      {selectedTab === "Macros" && (
        <>
          <View style={styles.header2}>
            <ThemedText style={{ fontSize: 20 }}>Your Macros</ThemedText>

            <TouchableOpacity
              onPress={() => setMacroModalVisible(true)}
              style={styles.addButton2}
            >
              <ThemedText style={{ color: "white" }}>+</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/macroProgress")}
              style={styles.addButton2}
            >
              <Ionicons name="bar-chart" size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/calories")}
              style={styles.addButton2}
            >
              <FontAwesome5 name="book-open" size={15} color="white" />
            </TouchableOpacity>

            {/* DropDownPicker for Macro Year Filter */}
            <DropDownPicker
              open={openMacroYearDropdown}
              value={selectedMacroYear}
              items={macroYearOptions}
              setOpen={setOpenMacroYearDropdown}
              setValue={setSelectedMacroYear}
              setItems={setMacroYearOptions}
              placeholder="Select Year"
              listMode="SCROLLVIEW"
              dropDownDirection="BOTTOM"
              maxHeight={200}
              containerStyle={{ width: 100, zIndex: 1000 }}
              style={{
                height: 50,
                backgroundColor: "#2c2c2c",
                borderColor: "#444444",
              }}
              dropDownContainerStyle={{
                backgroundColor: "#2c2c2c",
                borderColor: "#444444",
              }}
              textStyle={{ color: "#fff" }}
              labelStyle={{ color: "#fff" }}
              selectedItemLabelStyle={{ fontWeight: "bold" }}
              arrowIconStyle={{ tintColor: "#fff" }}
              tickIconStyle={{ tintColor: "#fff" }}
            />
            <Pressable onPress={() => setShowDatePicker(!showDatePicker)}>
              <View
                style={{
                  height: 50,
                  backgroundColor: "#2c2c2c",
                  borderColor: "#444444",
                }}
              >
                <ThemedText>{macroSelectorDate}</ThemedText>
              </View>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={macroSelectorDate}
                mode="date"
                onChange={onChangeDate}
                maximumDate={new Date()}
                testID="date-picker"
              />
            )}
          </View>

          {macros.length === 0 ? (
            <Text style={styles.graphPlaceholder}>
              {allMacros.length === 0
                ? "No macro entries available. Add an entry to get started!"
                : `No macros for ${selectedMacroYear}.`}
            </Text>
          ) : (
            <FlatList
              data={macros}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isOpen = openedMacros.has(item.id);

                // Handle createdAt timestamp or Date object
                let createdDate = null;
                if (item.createdAt) {
                  if (item.createdAt.toDate) {
                    createdDate = item.createdAt.toDate();
                  } else if (item.createdAt instanceof Date) {
                    createdDate = item.createdAt;
                  } else {
                    createdDate = new Date(item.createdAt);
                  }
                }

                const now = new Date();
                let dateStr = "";
                let relativeStr = "";
                if (createdDate) {
                  const diffTime = Math.abs(now - createdDate);
                  const diffDays = (() => {
                    const d1 = new Date(
                      createdDate.getFullYear(),
                      createdDate.getMonth(),
                      createdDate.getDate(),
                    );
                    const d2 = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                    );
                    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
                  })();

                  dateStr = createdDate.toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });

                  relativeStr =
                    diffDays === 0
                      ? "Today"
                      : diffDays === 1
                        ? "1 day ago"
                        : `${diffDays} days ago`;
                }

                return (
                  <TouchableOpacity
                    testID="macro-card-button"
                    onPress={() => toggleMacro(item.id)}
                    style={styles.card}
                  >
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {createdDate && (
                      <Text style={{ color: "#555", marginTop: 4 }}>
                        {`${dateStr} Macros (${relativeStr})`}
                      </Text>
                    )}

                    {isOpen && (
                      <View style={styles.cardContentContainer}>
                        {/* Left side: macro details and buttons */}
                        <View>
                          <Text style={{ fontWeight: "bold", color: "red" }}>
                            Total Calories: {item.calories} cal
                          </Text>
                          <Text
                            style={{ fontWeight: "bold", color: "#4CAF50" }}
                          >
                            Total Protein: {item.protein} g
                          </Text>
                          <Text
                            style={{ fontWeight: "bold", color: "#2196F3" }}
                          >
                            Total Carbs: {item.carbs} g
                          </Text>
                          <Text
                            style={{ fontWeight: "bold", color: "#FFC107" }}
                          >
                            Total Fats: {item.fats} g
                          </Text>

                          <View style={styles.macroButtonsRow}>
                            <TouchableOpacity
                              testID={`edit-button-${item.id}`}
                              onPress={() => openEditMacro(item)}
                            >
                              <Ionicons
                                name="pencil-outline"
                                size={20}
                                color="#007AFF"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              testID={`delete-button-${item.id}`}
                              onPress={() => handleDeleteMacro(item.id)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color="#ff3b30"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Right side: pie chart */}
                        <PieChart
                          data={[
                            {
                              name: "Protein",
                              grams: Number(item.protein) || 0,
                              color: "#4CAF50",
                            },
                            {
                              name: "Carbs",
                              grams: Number(item.carbs) || 0,
                              color: "#2196F3",
                            },
                            {
                              name: "Fats",
                              grams: Number(item.fats) || 0,
                              color: "#FFC107",
                            },
                          ]}
                          width={200}
                          height={150}
                          chartConfig={{
                            backgroundGradientFrom: "#1c1c1c",
                            backgroundGradientTo: "#2c2c2c",
                            color: (opacity = 1) =>
                              `rgba(255, 255, 255, ${opacity})`,
                            labelColor: () => "#fff",
                          }}
                          accessor="grams"
                          backgroundColor="transparent"
                          paddingLeft="10"
                          center={[0, 0]}
                          absolute
                          hasLegend={false}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}

      <Modal
        visible={macroModalVisible}
        transparent={true}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
            >
              <SafeAreaView
                style={{
                  flex: 1,
                  justifyContent: "center",
                  paddingHorizontal: 20,
                }}
              >
                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>
                    {editingMacro ? "Edit Macro Entry" : "Add New Macro"}
                  </ThemedText>

                  {/* Macro Title Label and Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={{ color: "white" }}>
                      Macro Title:
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Add in your Macros Title"
                      placeholderTextColor="grey"
                      value={macroTitle}
                      onChangeText={setMacroTitle}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowMacroDatePicker(true)}
                    style={styles.datePickerButton}
                  >
                    <ThemedText style={{ color: "white" }}>
                      Select Date: {macroDate.toLocaleDateString()}
                    </ThemedText>
                  </TouchableOpacity>

                  {showMacroDatePicker && (
                    <DateTimePicker
                      value={macroDate}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowMacroDatePicker(false);
                        if (selectedDate) setMacroDate(selectedDate);
                      }}
                    />
                  )}

                  {/* Calories Label and Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={{ color: "white" }}>
                      Total Calories (cal):
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Total Calories (cal)"
                      placeholderTextColor="grey"
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Protein Label and Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={{ color: "white" }}>
                      Total Protein (g):
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Total Protein (g)"
                      placeholderTextColor="grey"
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Carbs Label and Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={{ color: "white" }}>
                      Total Carbs (g):
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Total Carbs (g)"
                      placeholderTextColor="grey"
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Fats Label and Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={{ color: "white" }}>
                      Total Fats (g):
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Total Fats (g)"
                      placeholderTextColor="grey"
                      value={fats}
                      onChangeText={setFats}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalButtonRow}>
                    <ThemedButton onPress={handleSubmitMacros}>
                      <ThemedText style={{ color: "white" }}>
                        {editingMacro ? "Save" : "Submit"}
                      </ThemedText>
                    </ThemedButton>

                    <ThemedButton
                      onPress={handleCancelMacroEntry}
                      style={{ backgroundColor: "grey" }}
                    >
                      <ThemedText style={{ color: "white" }}>Cancel</ThemedText>
                    </ThemedButton>
                  </View>
                </View>
              </SafeAreaView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {selectedTab === "weight" && (
        <>
          <View style={styles.header3}>
            <ThemedText style={{ fontSize: 17 }}>Your Bodyweights</ThemedText>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
                setEditingWeight(null);
                setWeightInput("");
                setDate(new Date());
                setOriginalWeightInput("");
                setOriginalDate(new Date());
              }}
              style={styles.addButton2}
            >
              <ThemedText style={{ color: "white" }}>+</ThemedText>
            </TouchableOpacity>

            <DropDownPicker
              testID="weightDropdown"
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
                        testID={`delete-button-${w.id}`}
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
                  <ThemedText style={{ color: "white" }}>
                    Select Date: {date.toLocaleDateString()}
                  </ThemedText>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
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
                    <ThemedText style={{ color: "white" }}>
                      {editingWeight ? "Save" : "Submit"}
                    </ThemedText>
                  </ThemedButton>

                  <ThemedButton
                    onPress={handleCancelWeightEntry}
                    style={{ backgroundColor: "grey" }}
                  >
                    <ThemedText style={{ color: "white" }}>Cancel</ThemedText>
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
    justifyContent: "center",
    alignItems: "center",
    width: 37,
    height: 40,
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
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: "white",
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
  cardContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 35,
  },
  macroButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  inputGroup: {
    width: "100%",
  },
});
