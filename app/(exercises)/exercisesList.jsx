import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "../../components/themedView";
import { FlatList, View, StyleSheet, Dimensions } from "react-native";
import ThemedText from "../../components/themedText";
import ThemedButton from "../../components/themedButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { capWords } from "../index"; // import this if not already

const baseURL = "https://exercisedb.p.rapidapi.com/exercises/";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": process.env.EXPO_PUBLIC_EXERCISE_API_KEY,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function ExercisesList() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params?.mode;
  const query = params?.query;
  const [searchRes, setSearchRes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const cacheTemp = await AsyncStorage.getItem(mode.toString());

      if (cacheTemp) {
        const readable = JSON.parse(cacheTemp);
        if (readable.hasOwnProperty(query.toString())) {
          setSearchRes(readable[query]);
          return;
        }
      }

      const searchUrl = `${baseURL}${mode}/${query}`;
      const response = await fetch(searchUrl, options);
      const res = await response.json();
      setSearchRes(res);

      if (cacheTemp) {
        const updated = { ...JSON.parse(cacheTemp), [query]: res };
        await AsyncStorage.setItem(mode, JSON.stringify(updated));
      }
    };
    fetchData();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>
        {capWords(query?.split(" ")).join(" ")} exercises
      </ThemedText>

      <FlatList
        data={searchRes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ width: "100%", paddingBottom: 20 }}
        renderItem={({ item }) => (
          <ThemedButton
            style={styles.results}
            onPress={() => {
              router.push({
                pathname: "/exerciseDetails",
                params: {
                  name: item?.name,
                  id: item?.id,
                  equipment: item?.equipment,
                  description: item?.description,
                  bodyPart: item?.bodyPart,
                  secondaryMuscles: item?.secondaryMuscles,
                  instructions: encodeURIComponent(
                    JSON.stringify(item?.instructions),
                  ),
                },
              });
            }}
          >
            <ThemedText style={{ color: "white" }}>
              {capWords(item.name.split(" ")).join(" ")}
            </ThemedText>
          </ThemedButton>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    width: screenWidth,
  },
  separator: {
    height: 10,
  },
  results: {
    width: "100%",
    paddingVertical: 15,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    borderWidth: 1,
    borderColor: "rgba(182,220,221,0.2)",
  },
  heading: {
    fontSize: 22,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
});
