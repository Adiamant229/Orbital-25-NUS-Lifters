//react and expo imports 
import {RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text} from "react-native";
import { MaterialIcons } from "@expo/vector-icons/";
import { useRouter } from "expo-router";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import React from "react";
import {SafeAreaProvider} from "react-native-safe-area-context";

const gymCapacity = () => {
    const router = useRouter();
    const [gyms, setGyms] = React.useState([])
    const [time, setTime] = React.useState(new Date())
    const [loading, setLoading] = React.useState(true)
    const [refreshing, setRefreshing] = React.useState(false);
    const fetchData = async() => {
        try {
            setLoading(true);
            const response = await fetch(
                "https://asia-southeast1-nus-lifters-club.cloudfunctions.net/" +
                "getCapacity");
            const data = response.json();
            data.then((stuff) => {
                setLoading(false);
                const timestamp = new Date(
                    stuff.timestamp._seconds * 1000);
                setGyms(stuff.gym_capacity);
                setTime(timestamp);
            })
        } catch(err) {
            console.error("Error calling getCapacity", err);
        }
    };
    React.useEffect(() => {
        fetchData()
    }, [])
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            fetchData().finally(() => setRefreshing(false));
        }, 5000);
    }, []);
    return (
        <>
        <SafeAreaProvider>
        <ThemedView style={styles.container}>
                <SafeAreaView>
                    <ScrollView refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }>
                        <Spacer/>
                        <ThemedText style={styles.title} title={true}>
                            Gym Traffic {"\n"}
                            (as of {loading
                            ? "Loading"
                            : time.toLocaleString()})
                        </ThemedText>

                        <Spacer />
                        <ThemedView style={styles.buttonContainer}>
                            <ThemedButton
                                style={styles.button}
                                onPress={() => router.push("/utownReports")}
                            >
                                <ThemedText>
                                    UTown Gym:
                                    { loading && gyms.length === 0 ? "Loading"
                                        : gyms[1].capacity }
                                </ThemedText>
                                <Spacer />
                                <MaterialIcons size={50} name="groups" />
                            </ThemedButton>

                            <ThemedButton
                                style={styles.button}
                                onPress={() => router.push("/mpshReports")}
                            >
                                <ThemedText>MPSH Gym: { loading && gyms.length === 0 ? "Loading" : gyms[0].capacity }</ThemedText>
                                <Spacer />
                                <MaterialIcons size={50} name="groups" />
                            </ThemedButton>
                            <ThemedButton
                                onPress={() => router.push("/uscReports")}
                            ><Text>USC Gym: Under Maintenance</Text></ThemedButton>
                        </ThemedView>
                    </ScrollView>
                </SafeAreaView>
        </ThemedView>
        </SafeAreaProvider>
        </>
    );
};

export default gymCapacity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
  },

  buttonContainer: {
    flexDirection: "row", 
    width: "100%", 
    justifyContent: "space-between", 
  },

  button: {
    width: "48%", 
    marginHorizontal: 6, 
    paddingVertical: 80, 
    alignItems: "center", 
    justifyContent: "center",
  },
});
