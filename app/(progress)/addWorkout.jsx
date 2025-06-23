//react and expo import s
import { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

//themed components 
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import ThemedTextInput from "../../components/themedTextInput";

//firebase imports 
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";


const AddWorkout = () => {
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [workoutTimePeriod, setWorkoutTimePeriod] = useState(null);
  const [openTimeDropdown, setOpenTimeDropdown] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);

  const { editWorkoutId } = useLocalSearchParams();

  //exercise dropdown box
  const exerciseOptions = [
    { label: "Bench Press", value: "Bench Press" },
    { label: "Deadlift", value: "Deadlift" },
    { label: "Squat", value: "Squat" },
    { label: "Pull-up", value: "Pull-up" },
    { label: "Incline Dumbbell Press ", value: "Incline Dumbbell Press" },
    { label: "Incline Bench", value: "Incline Bench" },
    { label: "Dumbbell Lateral Raises", value: "Dumbbell Lateral Raises" },
    {
      label: "Overhead Triceps Cable Extensions",
      value: "Overhead Triceps Cable Extensions",
    },
    { label: "Cable Pullovers", value: "Cable PullOvers" },
    { label: "Lat Pulldown", value: "Lat Pulldown" },
    { label: "Barbell Bent-over Rows", value: "Barbell Bent-over Rows" },
    { label: "Barbell Shrugs", value: "Barbell Shrugs" },
    { label: "Dumbbell Curls", value: "Dumbbell Curls" },
    { label: "Preacher Curls", value: "Preacher Curls" },
    { label: "Hammer Curls", value: "Hammer Curls" },
    { label: "Barbell Back Squat", value: "Barbell Back Squat" },
    { label: "Seated Hamstring Curls", value: "Seated Hamstring Curls" },
    { label: "Leg Press", value: "Leg Press" },
    { label: "Dumbbell RDLs", value: "Dumbbell RDLs" },
    { label: "Standing Calf Raises", value: "Standing Calf Raises" },
    { label: "Leg Extensions", value: "Leg Extensions" },
  ];

  useEffect(() => {
    if (editWorkoutId) {
      const fetchWorkout = async () => {
        try {
          const docRef = doc(db, "workouts", editWorkoutId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWorkoutName(data.name || "");
            setWorkoutNotes(data.workoutNotes || "");
            setExercises(data.exercises || []);
            setWorkoutTimePeriod(data.timePeriod || null);
            setDate(
              data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            );
          } else {
            Alert.alert("Workout not found.");
            router.back();
          }
        } catch (error) {
          console.error("Error fetching workout:", error);
          Alert.alert("Failed to fetch workout data.");
        }
      };
      fetchWorkout();
    }
  }, [editWorkoutId]);

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        id: exercises.length + 1,
        name: null,
        sets: [],
      },
    ]);
  };

  const handleChangeExerciseName = (index, value) => {
    const updated = [...exercises];
    updated[index].name = value;
    setExercises(updated);
  };

  const handleAddSetToExercise = (exerciseIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({
      reps: "",
      weight: "",
      openReps: false,
      openWeight: false,
    });
    setExercises(updated);
  };

  const handleChangeSet = (exerciseIndex, setIndex, key, value) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][key] = value;
    setExercises(updated);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Please enter a workout name.");
      return;
    }
    if (exercises.length === 0) {
      Alert.alert("Add at least one exercise.");
      return;
    }
    if (!workoutTimePeriod) {
      Alert.alert("Please select a workout time period.");
      return;
    }

    const save = async () => {
      try {
        if (editWorkoutId) {
          await updateDoc(doc(db, "workouts", editWorkoutId), {
            name: workoutName.trim(),
            workoutNotes,
            exercises,
            timePeriod: workoutTimePeriod,
            createdAt: date,
          });
        } else {
          await addDoc(collection(db, "workouts"), {
            name: workoutName.trim(),
            workoutNotes,
            exercises,
            timePeriod: workoutTimePeriod,
            createdAt: date,
          });
        }
        router.back();
      } catch (error) {
        console.error("Error saving workout:", error);
        Alert.alert("Failed to save workout.");
      }
    };

    Alert.alert(
      editWorkoutId ? "Update Workout" : "Track Workout",
      editWorkoutId
        ? "Are you sure you want to update this workout?"
        : "Are you sure you want to track this workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: editWorkoutId ? "Update" : "Track",
          style: "cancel",
          onPress: save,
        },
      ]
    );
  };
  
  

  const handleDeleteExercise = (index) => {
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
  };

  const handleDeleteSet = (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(updated);
  };

  const dropdownListMode = Platform.OS === "android" ? "MODAL" : "SCROLLVIEW";

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <ThemedText style={styles.title}>
            {editWorkoutId ? "Edit Workout" : "Track New Workout"}
          </ThemedText>
          <ThemedTextInput
            placeholder="Add in workout title"
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholderTextColor="grey"
          />

          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerButton}
            >
              <ThemedText>Select Date: {date.toLocaleDateString()}</ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={onChangeDate}
              />
            )}

            <View style={styles.timeDropdownContainer}>
              <DropDownPicker
                open={openTimeDropdown}
                value={workoutTimePeriod}
                items={[
                  { label: "Morning", value: "Morning" },
                  { label: "Afternoon", value: "Afternoon" },
                  { label: "Night", value: "Night" },
                ]}
                setOpen={setOpenTimeDropdown}
                setValue={setWorkoutTimePeriod}
                placeholder="Select Time Period:"
                style={styles.timeDropdown}
                dropDownContainerStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#ccc",
                  zIndex: 3000,
                }}
                listMode="SCROLLVIEW"
                dropDownDirection="BOTTOM"
              />
            </View>
          </View>

          <ThemedText style={{ marginBottom: 10, marginTop: 10 }}>
            Notes:
          </ThemedText>

          <ThemedTextInput
            placeholder="(optional)"
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            placeholderTextColor="grey"
          />

          {exercises.map((exercise, exerciseIndex) => (
            <View key={exercise.id}>
              <ThemedText style={styles.exerciseNumberText}>
                Exercise {exerciseIndex + 1}
              </ThemedText>

              <View
                style={[
                  styles.exerciseCard,
                  { zIndex: openDropdownIndex === exerciseIndex ? 2000 : 1000 },
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <DropDownPicker
                      open={openDropdownIndex === exerciseIndex}
                      value={exercise.name}
                      items={exerciseOptions}
                      setOpen={(isOpen) =>
                        setOpenDropdownIndex(isOpen ? exerciseIndex : null)
                      }
                      setValue={(callback) => {
                        const value = callback(exercise.name);
                        handleChangeExerciseName(exerciseIndex, value);
                      }}
                      placeholder="Select exercise"
                      style={styles.dropdown}
                      dropDownContainerStyle={{
                        backgroundColor: "#fff",
                        borderColor: "#ccc",
                        zIndex: 2000,
                      }}
                      listMode="SCROLLVIEW"
                      dropDownDirection="BOTTOM"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(exerciseIndex)}
                    style={styles.deleteExerciseButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                  </TouchableOpacity>
                </View>

                {exercise.sets.map((set, setIndex) => {
                  const setDropdownZIndex =
                    exercises[exerciseIndex].sets[setIndex].openReps ||
                    exercises[exerciseIndex].sets[setIndex].openWeight
                      ? 1500
                      : 500;
                  return (
                    <View
                      key={setIndex}
                      style={[styles.setRow, { zIndex: setDropdownZIndex }]}
                    >
                      <Text style={styles.setLabel}>Set {setIndex + 1}</Text>

                      <View style={{ flex: 1, marginRight: 5 }}>
                        <DropDownPicker
                          open={set.openReps}
                          value={set.reps}
                          items={[...Array(40)].map((_, i) => ({
                            label: `${i + 1} reps`,
                            value: `${i + 1}`,
                          }))}
                          setOpen={(open) => {
                            const updated = [...exercises];
                            updated[exerciseIndex].sets[setIndex].openReps =
                              open;
                            setExercises(updated);
                          }}
                          setValue={(callback) => {
                            const value = callback(set.reps);
                            handleChangeSet(
                              exerciseIndex,
                              setIndex,
                              "reps",
                              value
                            );
                          }}
                          placeholder="Reps"
                          style={styles.dropdown}
                          dropDownContainerStyle={[
                            styles.dropDownContainer,
                            { zIndex: set.openReps ? 1500 : 500 },
                          ]}
                          listMode={dropdownListMode}
                          dropDownDirection="BOTTOM"
                        />
                      </View>

                      <View style={{ flex: 1, marginRight: 5 }}>
                        <DropDownPicker
                          open={set.openWeight}
                          value={set.weight}
                          items={[...Array(201)].map((_, i) => {
                            const val = (i * 2.5).toFixed(1);
                            return { label: `${val} kg`, value: val };
                          })}
                          setOpen={(open) => {
                            const updated = [...exercises];
                            updated[exerciseIndex].sets[setIndex].openWeight =
                              open;
                            setExercises(updated);
                          }}
                          setValue={(callback) => {
                            const value = callback(set.weight);
                            handleChangeSet(
                              exerciseIndex,
                              setIndex,
                              "weight",
                              value
                            );
                          }}
                          placeholder="Weight (kg)"
                          style={styles.dropdown}
                          dropDownContainerStyle={[
                            styles.dropDownContainer,
                            { zIndex: set.openWeight ? 1500 : 500 },
                          ]}
                          listMode={dropdownListMode}
                          dropDownDirection="BOTTOM"
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDeleteSet(exerciseIndex, setIndex)}
                        style={styles.deleteSetButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff3b30"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={() => handleAddSetToExercise(exerciseIndex)}
                  style={styles.addSetButton}
                >
                  <ThemedText style={{ color: "#007bff" }}>
                    + Add Set
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleAddExercise}
            style={styles.addExerciseButton}
          >
            <ThemedText style={{ color: "#28a745" }}>+ Add Exercise</ThemedText>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <ThemedButton onPress={handleSaveWorkout}>
              <ThemedText>
                {editWorkoutId ? "Save" : "Submit"}
              </ThemedText>
            </ThemedButton>
            <ThemedButton onPress={() => router.back()}>
              <ThemedText>Cancel</ThemedText>
            </ThemedButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default AddWorkout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  scrollContainer: {
    paddingBottom: 100,
    overflow: "visible" 
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10
  },
  addExerciseButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    marginTop: 10
  },
  exerciseCard: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#1c1c1c",
    overflow: "visible"
  },
  dropdown: {
    marginBottom: 10,
    borderColor: "#ccc",
    zIndex: 1
  },
  dropDownContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc"
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    overflow: "visible",
    zIndex: 500
  },
  addSetButton: {
    alignSelf: "flex-start",
    marginTop: 5
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    overflow: "visible"
  },
  deleteExerciseButton: {
    marginLeft: 10,
    paddingHorizontal: 6
  },
  deleteSetButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6
  },
  setLabel: {
    width: 60,
    fontWeight: "bold",
    alignSelf: "center",
    color: "#fff",
    paddingBottom: 10
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    overflow: "visible"
  },
  datePickerButton: {
    flex: 1,
  },
  timeDropdownContainer: {
    flex: 1,
    maxWidth: 150,
    marginLeft: 10,
    overflow: "visible"
  },
  timeDropdown: {
    borderColor: "#ccc",
    zIndex: 1
  },
});
