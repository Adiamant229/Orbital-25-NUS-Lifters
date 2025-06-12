import React, { useEffect, useState } from "react";
import { ScrollView, Dimensions, View } from "react-native";
import { query, collection, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";

import { LineChart } from "react-native-chart-kit";
import DropDownPicker from "react-native-dropdown-picker";

const screenWidth = Dimensions.get("window").width;

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

const Progression = () => {
  const [exerciseData, setExerciseData] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "workouts"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataByExercise = {};
      const allExercisesSet = new Set();

      snapshot.docs.forEach((doc) => {
        const workout = doc.data();
        const dateStr = workout.createdAt
          ? workout.createdAt.toDate().toLocaleDateString("en-SG", {
              day: "2-digit",
              month: "short",
            })
          : "Unknown";

        workout.exercises?.forEach((ex) => {
          const name = ex.name.trim();
          allExercisesSet.add(name);

          const heaviest = Math.max(...ex.sets.map((s) => s.weight));
          if (!dataByExercise[name]) dataByExercise[name] = [];
          dataByExercise[name].push({ date: dateStr, weight: heaviest });
        });
      });

      // If no exercises selected yet, select all by default
      if (selectedExercises.length === 0) {
        const allExercises = Array.from(allExercisesSet);
        setSelectedExercises(allExercises);
        setItems(allExercises.map((ex) => ({ label: ex, value: ex })));
      } else {
        // Update dropdown items in case new exercises appear later
        setItems(
          Array.from(allExercisesSet).map((ex) => ({ label: ex, value: ex }))
        );
      }

      setExerciseData(dataByExercise);
    });

    return () => unsubscribe();
  }, [selectedExercises]);

  const renderChart = (title, data) => {
    if (!data || data.length === 0) return null;

    // Sort data by date for proper chart display
    const sortedData = data.slice().sort((a, b) => {
      // Parse date strings "dd MMM"
      const parseDate = (d) => {
        const [day, month] = d.date.split(" ");
        return new Date(`${month} ${day}, ${new Date().getFullYear()}`);
      };
      return parseDate(a) - parseDate(b);
    });

    const labels = sortedData.map((entry) => entry.date);
    const weights = sortedData.map((entry) => entry.weight);

    return (
      <View key={title} style={{ marginVertical: 16 }}>
        <ThemedText
          style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}
        >
          {title}
        </ThemedText>
        <LineChart
          data={{
            labels,
            datasets: [{ data: weights }],
          }}
          width={screenWidth - 30}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 16 }}
        />
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1, padding: 15, paddingTop: 80 }}>
      <ThemedText
        style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}
      >
        Exercise Progression
      </ThemedText>

      <DropDownPicker
        multiple={true}
        min={1}
        max={items.length}
        open={open}
        value={selectedExercises}
        items={items}
        setOpen={setOpen}
        setValue={setSelectedExercises}
        setItems={setItems}
        placeholder="Select exercises to display"
        containerStyle={{ marginBottom: 20 }}
      />

      <ScrollView>
        {Object.entries(exerciseData)
          .filter(([exercise]) => selectedExercises.includes(exercise))
          .map(([exercise, data]) => renderChart(exercise, data))}
      </ScrollView>
    </ThemedView>
  );
};

export default Progression;
