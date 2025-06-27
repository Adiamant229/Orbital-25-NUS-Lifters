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
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";

const MacroProgress = () => {
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

  // Fixed macro types
  const macroTypes = ["Calories", "Protein", "Carbs", "Fats"];

  const [macroData, setMacroData] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedMacros, setSelectedMacros] = useState(macroTypes); 
  const [items, setItems] = useState(
    macroTypes.map((m) => ({ label: m, value: m }))
  );

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
      collection(db, "users", currentUser.uid, "macros"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataByMacro = {
        Calories: [],
        Protein: [],
        Carbs: [],
        Fats: [],
      };
      const yearSet = new Set();

      snapshot.docs.forEach((doc) => {
        const macroEntry = doc.data();
        const dateObj = macroEntry.createdAt?.toDate
          ? macroEntry.createdAt.toDate()
          : macroEntry.createdAt instanceof Date
          ? macroEntry.createdAt
          : new Date(macroEntry.createdAt);

        const year = dateObj?.getFullYear();
        if (year) yearSet.add(year);

        const dateStr = dateObj
          ? dateObj.toLocaleDateString("en-SG", {
              day: "2-digit",
              month: "short",
            })
          : "Unknown";

        // Push macro values by type with date and year for filtering
        dataByMacro.Calories.push({
          date: dateStr,
          value: macroEntry.calories,
          year,
        });
        dataByMacro.Protein.push({
          date: dateStr,
          value: macroEntry.protein,
          year,
        });
        dataByMacro.Carbs.push({
          date: dateStr,
          value: macroEntry.carbs,
          year,
        });
        dataByMacro.Fats.push({
          date: dateStr,
          value: macroEntry.fats,
          year,
        });
      });

      // Sort years and update year dropdown items
      const yearArray = Array.from(yearSet).sort((a, b) => a - b);
      setYearItems(yearArray.map((y) => ({ label: `${y}`, value: y })));

      // If current selected year not in data, set to last available year
      if (!yearSet.has(selectedYear) && yearArray.length > 0) {
        setSelectedYear(yearArray[yearArray.length - 1]);
      }

      setMacroData(dataByMacro);
    });

    return () => unsubscribe();
  }, [selectedYear]);

  const renderChart = (title, data) => {
    if (!data || data.length === 0) return null;

    // Filter data by selected year
    const filteredData = data.filter((entry) => entry.year === selectedYear);
    if (filteredData.length === 0) return null;

    // Sort by date
    const sortedData = filteredData.slice().sort((a, b) => {
      const [dayA, monthA] = a.date.split(" ");
      const [dayB, monthB] = b.date.split(" ");
      return (
        new Date(`${monthA} ${dayA}, ${selectedYear}`) -
        new Date(`${monthB} ${dayB}, ${selectedYear}`)
      );
    });

    const labels = sortedData.map((entry) => entry.date);
    const values = sortedData.map((entry) => entry.value);

    return (
      <View key={title} style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>
          {title} ({selectedYear})
        </ThemedText>
        <LineChart
          data={{ labels, datasets: [{ data: values }] }}
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
      <ThemedText style={styles.pageTitle}>Macro Progress</ThemedText>

      <View style={styles.dropdownRow}>
        <View style={styles.exercisePicker}>
          <DropDownPicker
            min={1}
            max={items.length}
            open={open}
            value={selectedMacros}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedMacros}
            setItems={setItems}
            multiple={true}
            placeholder="Select Macros"
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
        {selectedMacros.map((macro) => renderChart(macro, macroData[macro]))}
      </ScrollView>
    </ThemedView>
  );
};

export default MacroProgress;

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
