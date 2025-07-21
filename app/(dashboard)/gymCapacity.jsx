//react and expo imports
import { useState, useEffect, useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";

const GymCapacity = () => {
  const router = useRouter();
  const [gyms, setGyms] = useState([]);
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getCapacityColor = (current, max) => {
    if (!current || !max) return "green";
    const ratio = current / max;
    if (ratio > 0.8) return "red";
    if (ratio >= 0.5) return "orange";
    return "green";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://asia-southeast1-nus-lifters-club.cloudfunctions.net/getCapacity"
      );
      const data = await response.json();
      const timestamp = new Date(data.timestamp._seconds * 1000);
      setGyms(data.gym_capacity);
      setTime(timestamp);
    } catch (error) {
      console.error("Error calling getCapacity", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Wait 5 seconds before refreshing data (to avoid hammering API)
    setTimeout(() => {
      fetchData().finally(() => setRefreshing(false));
    }, 5000);
  }, []);

  // Extract capacities with fallbacks
  const utownCapacityNum = parseInt(gyms[0]?.capacity) || 0;
  const utownMaxNum = parseInt(gyms[0]?.maxCapacity) || 120;

  const uscCapacityNum = parseInt(gyms[1]?.capacity) || 0;
  const uscMaxNum = parseInt(gyms[1]?.maxCapacity) || 120;

  return (
    <ThemedView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.iconWithTitle}>
          <MaterialCommunityIcons
            name="access-point"
            size={30}
            color="#2196f3"
          />
          <ThemedText style={styles.title} title>
            Live Gym Capacity
          </ThemedText>
        </ThemedView>

        <ThemedText style={styles.timestampText} testID="last-updated">
          Last updated at{" "}
          {loading
            ? "Loading"
            : time
                .toLocaleString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
                .replace(" at ", ", ")}
        </ThemedText>

        <ThemedView style={styles.buttonContainer}>
          <ThemedButton
            style={[
              styles.button,
              {
                backgroundColor: getCapacityColor(
                  utownCapacityNum,
                  utownMaxNum
                ),
              },
            ]}
            onPress={() => router.push("/utownReports")}
          >
            <ThemedText style={{ color: "white" }}>
              UTown Gym:{" "}
              {loading || gyms.length === 0
                ? "Loading"
                : `${gyms[0]?.capacity ?? "-"}`}
            </ThemedText>
            <MaterialIcons size={50} name="groups" />
          </ThemedButton>

          <ThemedButton
            style={[
              styles.button,
              { backgroundColor: getCapacityColor(uscCapacityNum, uscMaxNum) },
            ]}
            onPress={() => router.push("/uscReports")}
          >
            <ThemedText style={{ color: "white" }}>
              USC Gym:{" "}
              {loading || gyms.length === 0
                ? "Loading"
                : `${gyms[1]?.capacity ?? "-"}`}
            </ThemedText>
            <MaterialIcons size={50} name="groups" />
          </ThemedButton>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

export default GymCapacity;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 70,
  },
  scrollContent: {
    padding: 20,
  },
  iconWithTitle: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
  },
  timestampText: {
    textAlign: "left",
  },
  buttonContainer: {
    flexDirection: "column",
    width: "100%",
  },
  button: {
    width: "100%",
    paddingVertical: 10,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
});
