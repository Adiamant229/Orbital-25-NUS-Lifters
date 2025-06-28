//react and expo imports
import { useRef, useState, useEffect } from "react";
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
import { db, auth } from "../../firebaseConfig"; 
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";

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

  const nextExerciseId = useRef(1);
  const nextSetId = useRef(1);

  const [originalWorkout, setOriginalWorkout] = useState(null);

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

            setOriginalWorkout({
              name: data.name || "",
              workoutNotes: data.workoutNotes || "",
              exercises: data.exercises || [],
              timePeriod: data.timePeriod || null,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(),
            });

            setWorkoutName(data.name || "");
            setWorkoutNotes(data.workoutNotes || "");

            if (data.exercises && data.exercises.length > 0) {
              const exercisesWithIds = data.exercises.map((ex) => {
                const exId = ex.id ?? nextExerciseId.current++;
                const setsWithIds = ex.sets
                  ? ex.sets.map((set) => ({
                      ...set,
                      id: set.id ?? nextSetId.current++,
                    }))
                  : [];
                return { ...ex, id: exId, sets: setsWithIds };
              });

              const maxExerciseId = Math.max(
                ...exercisesWithIds.map((e) => e.id || 0),
                0
              );
              nextExerciseId.current = maxExerciseId + 1;

              const allSetIds = exercisesWithIds.flatMap((e) =>
                e.sets.map((s) => s.id || 0)
              );
              const maxSetId = Math.max(...allSetIds, 0);
              nextSetId.current = maxSetId + 1;

              setExercises(exercisesWithIds);
            } else {
              setExercises([]);
            }

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
    setExercises((prev) => [
      ...prev,
      { id: nextExerciseId.current++, name: null, sets: [] },
    ]);
  };

  const handleChangeExerciseName = (index, value) => {
    const updated = [...exercises];
    updated[index].name = value;
    setExercises(updated);
  };

  const handleAddSetToExercise = (exerciseIndex) => {
    setExercises((prevExercises) => {
      const updated = [...prevExercises];
      updated[exerciseIndex].sets.push({
        id: nextSetId.current++,
        reps: "",
        weight: "",
        openReps: false,
        openWeight: false,
      });
      return updated;
    });
  };

  const handleChangeSet = (exerciseIndex, setIndex, key, value) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][key] = value;
    setExercises(updated);
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

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Please enter a workout name.");
      return;
    }

    if (!workoutTimePeriod) {
      Alert.alert("Please select a workout time period.");
      return;
    }
    const validExercises = exercises.filter(
      (ex) => ex.name && ex.name.trim() !== ""
    );
    if (validExercises.length === 0) {
      Alert.alert("Please add at least one exercise.");
      return;
    }

    for (const ex of validExercises) {
      if (!ex.sets || ex.sets.length === 0) {
        Alert.alert("Please add at least one set to each exercise.");
        return;
      }
    }
    for (const ex of validExercises) {
      for (const set of ex.sets) {
        if (!set.reps || !set.weight) {
          Alert.alert("Please fill in reps and weight for all sets.");
          return;
        }
      }
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("You must be logged in to save a workout.");
      return;
    }
    const userId = currentUser.uid;

    const save = async () => {
      try {
        if (editWorkoutId) {
          await updateDoc(doc(db, "workouts", editWorkoutId), {
            name: workoutName.trim(),
            workoutNotes,
            exercises: validExercises,
            timePeriod: workoutTimePeriod,
            createdAt: date,
            userId,
          });
        } else {
          await addDoc(collection(db, "workouts"), {
            name: workoutName.trim(),
            workoutNotes,
            exercises,
            timePeriod: workoutTimePeriod,
            createdAt: date,
            userId,
          });
        }
        Alert.alert(
          "Success",
          editWorkoutId ? "Workout updated!" : "Workout added!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } catch (error) {
        console.error("Error saving workout:", error);
        Alert.alert("Failed to save workout.");
      }
    };

    Alert.alert(
      editWorkoutId ? "Update Workout" : "Save Workout",
      editWorkoutId
        ? "Are you sure you want to update this workout?"
        : "Are you sure you want to save this workout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: editWorkoutId ? "Update" : "Save", onPress: save },
      ]
    );
  };

  const isDeepEqual = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const changesDone = () => {
    if (!originalWorkout) {
      return (
        workoutName.trim() !== "" ||
        workoutNotes.trim() !== "" ||
        workoutTimePeriod !== null ||
        (exercises.length > 0 &&
          exercises.some(
            (ex) =>
              (ex.name && ex.name.trim() !== "") ||
              (ex.sets &&
                ex.sets.length > 0 &&
                ex.sets.some(
                  (set) =>
                    (set.reps && set.reps !== "") ||
                    (set.weight && set.weight !== "")
                ))
          ))
      );
    }

    if (workoutName !== originalWorkout.name) return true;
    if (workoutNotes !== originalWorkout.workoutNotes) return true;
    if (workoutTimePeriod !== originalWorkout.timePeriod) return true;

    if (!isDeepEqual(exercises, originalWorkout.exercises)) return true;
    
    return false;
  };

  const handleCancelPress = () => {
    if (changesDone()) {
      Alert.alert(
        editWorkoutId ? "Discard Changes?" : "Cancel New Workout?",
        editWorkoutId
          ? "You have unsaved changes. Are you sure you want to discard them?"
          : "You have started creating a new workout. Are you sure you want to cancel?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };
  

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

          <View style={[styles.dateTimeRow, { zIndex: 3000 }]}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerButton}
              testID="open-date-picker-btn"
            >
              <ThemedText>Select Date: {date.toLocaleDateString()}</ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={onChangeDate}
                testID="date-picker"
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
                maxHeight={200}
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
                      listMode={dropdownListMode}
                      dropDownDirection="BOTTOM"
                      maxHeight={200}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(exerciseIndex)}
                    style={styles.deleteExerciseButton}
                    testID={`delete-exercise-btn-${exercise.id}`}
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
                          maxHeight={200}
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
                          maxHeight={200}
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
              <ThemedText>{editWorkoutId ? "Save" : "Submit"}</ThemedText>
            </ThemedButton>
            <ThemedButton onPress={handleCancelPress}>
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
    paddingBottom: 100,
  },
  scrollContainer: {
    paddingBottom: 100,
    overflow: "visible",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addExerciseButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    marginTop: 10,
  },
  exerciseCard: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#1c1c1c",
    overflow: "visible",
  },
  dropdown: {
    marginBottom: 10,
    borderColor: "#ccc",
  },
  dropDownContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    overflow: "visible",
  },
  addSetButton: {
    alignSelf: "flex-start",
    marginTop: 5,
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
    overflow: "visible",
  },
  deleteExerciseButton: {
    marginLeft: 10,
    paddingHorizontal: 6,
  },
  deleteSetButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  setLabel: {
    width: 60,
    fontWeight: "bold",
    alignSelf: "center",
    color: "#fff",
    paddingBottom: 10,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    overflow: "visible",
  },
  datePickerButton: {
    flex: 1,
  },
  timeDropdownContainer: {
    flex: 1,
    maxWidth: 150,
    marginLeft: 10,
    overflow: "visible",
  },
  timeDropdown: {
    borderColor: "#ccc",
  },
});
