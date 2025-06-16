//react and expo imports 
import { useState, useEffect } from "react";
import {
  View,
  Text, 
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter, useLocalSearchParams } from "expo-router";

//themed components 
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import ThemedTextInput from "../../components/themedTextInput";

//firebase imports 
import { db } from "../../firebaseConfig";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

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
  const [exercises, setExercises] = useState([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  
  const { editWorkoutId } = useLocalSearchParams();

  useEffect(() => {
    if (editWorkoutId) {
      const fetchWorkout = async () => {
        try {
          const docRef = doc(db, "workouts", editWorkoutId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWorkoutName(data.name || "");
            setExercises(data.exercises || []);
            setWorkoutTimePeriod(data.timePeriod || null);
            setDate(
              data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            );
          } else {
            alert("Workout not found.");
            router.back();
          }
        } catch (error) {
          console.error("Error fetching workout:", error);
          alert("Failed to fetch workout data.");
        }
      };
      fetchWorkout();
    }
  }, [editWorkoutId]);

  //select exercise dropdown box 
  const exerciseOptions = [
    { label: "Bench Press", value: "Bench Press" },
    { label: "Deadlift", value: "Deadlift" },
    { label: "Squat", value: "Squat" },
    { label: "Pull-up", value: "Pull-up" },
    { label: "Incline Dumbbell Press ", value: "Incline Dumbbell Press" },
  ];

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
      alert("Please enter a workout name.");
      return;
    }
    if (exercises.length === 0) {
      alert("Add at least one exercise.");
      return;
    }
    if (!workoutTimePeriod) {
      alert("Please select a workout time period.");
      return;
    }

    try {
      if (editWorkoutId) {
        // Update existing workout
        await updateDoc(doc(db, "workouts", editWorkoutId), {
          name: workoutName.trim(),
          exercises,
          timePeriod: workoutTimePeriod,
          createdAt: date,
        });
      } else {
        // Add new workout
        await addDoc(collection(db, "workouts"), {
          name: workoutName.trim(),
          exercises,
          timePeriod: workoutTimePeriod,
          createdAt: serverTimestamp(),
        });
      }
      router.back();
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout.");
    }
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


  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
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
            <DateTimePicker value={date} mode="date" onChange={onChangeDate} />
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
              }}
              listMode="SCROLLVIEW"
              dropDownDirection="BOTTOM"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAddExercise}
          style={styles.addExerciseButton}
        >
          <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>
        {exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseCard}>
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

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {setIndex + 1}</Text>

                <View
                  style={{
                    flex: 1,
                    marginRight: 5,
                  }}
                >
                  <DropDownPicker
                    open={set.openReps}
                    value={set.reps}
                    items={[...Array(40)].map((_, i) => ({
                      label: `${i + 1} reps`,
                      value: `${i + 1}`,
                    }))}
                    setOpen={(open) => {
                      const updated = [...exercises];
                      updated[exerciseIndex].sets[setIndex].openReps = open;
                      setExercises(updated);
                    }}
                    setValue={(callback) => {
                      const value = callback(set.reps);
                      handleChangeSet(exerciseIndex, setIndex, "reps", value);
                    }}
                    placeholder="Reps"
                    style={styles.dropdown}
                    dropDownContainerStyle={{
                      backgroundColor: "#fff",
                      borderColor: "#ccc",
                    }}
                    listMode="SCROLLVIEW"
                    dropDownDirection="BOTTOM"
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                    marginRight: 5,
                  }}
                >
                  <DropDownPicker
                    open={set.openWeight}
                    value={set.weight}
                    items={[...Array(201)].map((_, i) => {
                      const val = (i * 2.5).toFixed(1);
                      return { label: `${val} kg`, value: val };
                    })}
                    setOpen={(open) => {
                      const updated = [...exercises];
                      updated[exerciseIndex].sets[setIndex].openWeight = open;
                      setExercises(updated);
                    }}
                    setValue={(callback) => {
                      const value = callback(set.weight);
                      handleChangeSet(exerciseIndex, setIndex, "weight", value);
                    }}
                    placeholder="Weight (kg)"
                    style={styles.dropdown}
                    dropDownContainerStyle={{
                      backgroundColor: "#fff",
                      borderColor: "#ccc",
                    }}
                    listMode="SCROLLVIEW"
                    dropDownDirection="BOTTOM"
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteSet(exerciseIndex, setIndex)}
                  style={styles.deleteSetButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => handleAddSetToExercise(exerciseIndex)}
              style={styles.addSetButton}
            >
              <Text style={styles.addSetButtonText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.buttonRow}>
          <ThemedButton onPress={handleSaveWorkout}>
            <ThemedText>Save</ThemedText>
          </ThemedButton>
          <ThemedButton onPress={() => router.back()}>
            <ThemedText>Cancel</ThemedText>
          </ThemedButton>
        </View>
      </KeyboardAwareScrollView>
    </ThemedView>
  );
};

export default AddWorkout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  nameInput: {
    marginBottom: 20,
  },
  addExerciseButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  addExerciseButtonText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  exerciseCard: {
    marginBottom: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#1c1c1c",
  },
  dropdown: {
    marginBottom: 10,
    borderColor: "#ccc",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  setInput: {
    flex: 1,
    marginRight: 10,
  },
  addSetButton: {
    alignSelf: "flex-start",
    marginTop: 5,
  },
  addSetButtonText: {
    color: "#28a745",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  deleteExerciseButton: {
    marginLeft: 10,
    paddingHorizontal: 6,
  },
  deleteExerciseButtonText: {
    fontSize: 18,
    color: "red",
  },
  deleteSetButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  deleteSetButtonText: {
    fontSize: 18,
    color: "red",
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
 
  },

  datePickerButton: {
    flex: 1,
  },

  timeDropdownContainer: {
    flex: 1,
    maxWidth: 150, // limit dropdown width
    marginLeft: 10,
  },

  timeDropdown: {
    borderColor: "#ccc",
  },
});
