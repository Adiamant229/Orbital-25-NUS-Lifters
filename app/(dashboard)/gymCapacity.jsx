//react and expo imports
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";

const GymCapacity = () => {
  const router = useRouter();
  const [gyms, setGyms] = React.useState([]);
  const [time, setTime] = React.useState(new Date());
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

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
        "https://asia-southeast1-nus-lifters-club.cloudfunctions.net/getCapacity",
      );
      const data = await response.json();
      const timestamp = new Date(data.timestamp._seconds * 1000);
      setGyms(data.gym_capacity);
      setTime(timestamp);
      setLoading(false);
    } catch (err) {
      console.error("Error calling getCapacity", err);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      fetchData().finally(() => setRefreshing(false));
    }, 5000);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.iconWithTitle}>
            <MaterialCommunityIcons
              name="access-point"
              size={30}
              color="#2196f3"
            />
            <ThemedText style={styles.title} title={true}>
              Live Gym Capacity
            </ThemedText>
          </View>

          <ThemedText style={{ textAlign: "left" }} testID="last-updated">
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
              style={{
                ...styles.button,
                backgroundColor: getCapacityColor(
                  gyms[2]?.capacity,
                  gyms[2]?.maxCapacity ?? 120,
                ),
              }}
              onPress={() => router.push("/utownReports")}
            >
              <ThemedText>
                UTown Gym:{" "}
                {loading || gyms.length === 0
                  ? "Loading"
                  : (gyms[2]?.capacity ?? "-")}
              </ThemedText>
              <MaterialIcons size={50} name="groups" />
            </ThemedButton>

            <ThemedButton
              style={{
                ...styles.button,
                backgroundColor: getCapacityColor(
                  gyms[1]?.capacity,
                  gyms[1]?.maxCapacity ?? 50,
                ),
              }}
              onPress={() => router.push("/uscReports")}
            >
              <ThemedText>
                USC Gym:{" "}
                {loading || gyms.length === 0
                  ? "Loading"
                  : (gyms[1]?.capacity ?? "-")}
              </ThemedText>
              <MaterialIcons size={50} name="groups" />
            </ThemedButton>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default GymCapacity;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
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
