// react and expo imports
import { useEffect, useState } from "react";
import { ScrollView, Dimensions, View, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import DropDownPicker from "react-native-dropdown-picker";

// themed components
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";

// firebase imports
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";

const ExerciseProgress = () => {
  const screenWidth = Dimensions.get("window").width;

  const chartConfig = {
    backgroundGradientFrom: "#2c2c2c",
    backgroundGradientTo: "#1c1c1c",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#007AFF",
      fill: "#FFFFFF",
    },
    propsForVerticalLabels: { fontSize: 10, fontWeight: "bold" },
    propsForHorizontalLabels: { fontSize: 10, fontWeight: "bold" },
    strokeWidth: 2,
    propsForBackgroundLines: {
      strokeDasharray: "0",
      stroke: "#444444",
    },
    barPercentage: 0,
    categoryPercentage: 0,
  };

  const [exerciseData, setExerciseData] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearItems, setYearItems] = useState([]);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    setYearItems(years.map((y) => ({ label: `${y}`, value: y })));
    setSelectedYear(currentYear);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "workouts"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataByExercise = {};
      const allExercisesSet = new Set();
      const yearSet = new Set();

      snapshot.docs.forEach((doc) => {
        const workout = doc.data();
        const dateObj = workout.createdAt?.toDate();
        const dateStr = dateObj
          ? dateObj.toLocaleDateString("en-SG", {
              day: "2-digit",
              month: "short",
            })
          : "Unknown";
        const year = dateObj?.getFullYear();
        if (year) yearSet.add(year);

        workout.exercises?.forEach((ex) => {
          const name = ex.name.trim();
          allExercisesSet.add(name);
          const heaviest = Math.max(...ex.sets.map((s) => s.weight));

          if (!dataByExercise[name]) dataByExercise[name] = [];
          dataByExercise[name].push({
            date: dateStr,
            weight: heaviest,
            year,
          });
        });
      });

      const yearArray = Array.from(yearSet).sort((a, b) => a - b);
      setYearItems(yearArray.map((y) => ({ label: `${y}`, value: y })));

      if (!yearSet.has(selectedYear)) {
        setSelectedYear(yearArray[yearArray.length - 1]);
      }

      if (selectedExercises.length === 0) {
        // No default selection: just set the available items
        setItems(
          allExercisesSet.size
            ? Array.from(allExercisesSet).map((ex) => ({
                label: ex,
                value: ex,
              }))
            : []
        );
      } else {
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

    const filteredData = data.filter((entry) => entry.year === selectedYear);
    if (filteredData.length === 0) return null;

    const sortedData = filteredData.slice().sort((a, b) => {
      const [dayA, monthA] = a.date.split(" ");
      const [dayB, monthB] = b.date.split(" ");
      return (
        new Date(`${monthA} ${dayA}, ${selectedYear}`) -
        new Date(`${monthB} ${dayB}, ${selectedYear}`)
      );
    });

    const labels = sortedData.map((entry) => entry.date);
    const weights = sortedData.map((entry) => entry.weight);

    return (
      <View key={title} style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>
          {title} ({selectedYear})
        </ThemedText>
        <LineChart
          data={{ labels, datasets: [{ data: weights }] }}
          width={screenWidth - 30}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.pageTitle}>Exercise Progress</ThemedText>

      <View style={styles.dropdownRow}>
        <View style={styles.exercisePicker}>
          <DropDownPicker
            min={1}
            max={items.length}
            open={open}
            value={selectedExercises}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedExercises}
            setItems={setItems}
            placeholder="Select Exercise"
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

        <View style={styles.yearPicker}>
          <DropDownPicker
            open={yearDropdownOpen}
            value={selectedYear}
            items={yearItems}
            setOpen={setYearDropdownOpen}
            setValue={setSelectedYear}
            setItems={setYearItems}
            placeholder="Select Year"
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
      </View>

      <ScrollView>
        {Object.entries(exerciseData)
          .filter(([exercise]) => selectedExercises.includes(exercise))
          .map(([exercise, data]) => renderChart(exercise, data))}
      </ScrollView>
    </ThemedView>
  );
};

export default ExerciseProgress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  exercisePicker: {
    flex: 1,
  },
  yearPicker: {
    width: 130,
  },
  chartContainer: {
    marginVertical: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
  },
});
