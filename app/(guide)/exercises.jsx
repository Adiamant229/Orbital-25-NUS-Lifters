//react imports
import {
  StyleSheet,
  FlatList,
  View,
  Dimensions,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import { useEffect, useState } from "react";
import { Searchbar } from "react-native-paper";
import ThemedButton from "../../components/themedButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { capWords } from "../index";

const screenWidth = Dimensions.get("window").width;
const baseURL = "https://exercisedb.p.rapidapi.com/exercises/";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": process.env.EXPO_PUBLIC_EXERCISE_API_KEY,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};

const Exercises = () => {
  const router = useRouter();
  const [targets, setTargets] = useState([""]); //for filtering
  const [equipment, setEquipment] = useState([""]);
  const [searchRes, setSearchRes] = useState([]);
  const [query, setQuery] = useState("");
  const [lastSearched, setLastSearched] = useState("");
  const [toggleRec, setToggleRec] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      try {
        const targetsUrl = baseURL + "targetList";
        const equipmentUrl = baseURL + "equipmentList";
        let response1 = fetch(targetsUrl, options);
        response1.then((res) => res.json()).then((res) => setTargets(res));
        const response2 = fetch(equipmentUrl, options);
        response2.then((res) => res.json()).then((res) => setEquipment(res));
      } catch (err) {
        console.error("Error fetching exercises: ", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const x = query.toLowerCase().trim();
      if (!x || x === lastSearched) {
        return;
      }
      setLastSearched(x);
      const searchUrl = baseURL + "name/" + x;
      fetch(searchUrl, options)
        .then((res) => res.json())
        .then((data) => setSearchRes(data));
    });

    return () => clearTimeout(delayDebounce);
  }, [query]);
  const redirect = (mode, query) => {
    router.push({
      pathname: "/exercisesList",
      params: { mode, query },
    });
  };
const sortedTargets = [...targets].sort((a, b) => a.localeCompare(b));
const sortedEquipment = [...equipment].sort((a, b) => a.localeCompare(b));
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.title} title={true}>
            Search your exercises all in one place!
          </ThemedText>

          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <Searchbar
              placeholder={"Search Exercise"}
              onChangeText={setQuery}
              value={query}
              style={{ flex: 3 }}
            />
          </View>

          <View style={{ alignSelf: "flex-start" }}>
            {/* The Dropdown menu */}
            <Pressable onPress={() => setToggleRec(!toggleRec)}>
              <View
                style={{
                  flexDirection: "row",
                  alignSelf: "flex-start",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <ThemedText style={{ fontSize: 16 }}>Find By</ThemedText>
                {toggleRec ? (
                  <Ionicons
                    name={"chevron-up-outline"}
                    color={"grey"}
                    size={20}
                  />
                ) : (
                  <Ionicons
                    name={"chevron-down-outline"}
                    color={"grey"}
                    size={20}
                  />
                )}
              </View>
            </Pressable>
            {toggleRec && (
              <ScrollView style={{ padding: 20 }}>
                <ThemedText style={{ fontSize: 15 }}>Body Part</ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 40,
                  }}
                >
                  <>
                    {sortedTargets.map((item, index) => (
                      <ThemedButton
                        key={index}
                        onPress={() => redirect("target", item)}
                        style={{
                          width: 140,
                          flexWrap: "wrap",
                        }}
                      >
                        <ThemedText style={{ color: "white" }} key={index}>
                          {item}
                        </ThemedText>
                      </ThemedButton>
                    ))}
                  </>
                </View>
                <ThemedText style={{ fontSize: 15 }}>Equipment</ThemedText>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                >
                  <>
                    {sortedEquipment.map((item, index) => {
                      return (
                        <ThemedButton
                          key={index}
                          onPress={() => redirect("equipment", item)}
                          style={{
                            backgroundColor: "#2196f3",
                            width: 140,
                            flexWrap: "wrap",
                          }}
                        >
                          <ThemedText style={{ color: "white" }} key={index}>
                            {item}
                          </ThemedText>
                        </ThemedButton>
                      );
                    })}
                  </>
                </View>
                <Spacer />
              </ScrollView>
            )}
          </View>

          <View style={styles.listContainer}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ alignContent: "center", width: "100%" }}
              data={searchRes}
              renderItem={({ item }) => {
                return (
                  <>
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
                              JSON.stringify(item?.instructions)
                            ),
                          },
                        });
                      }}
                    >
                      <ThemedText style={{ color: "white" }}>
                        {capWords(item.name.split(" ")).join(" ")}
                      </ThemedText>
                    </ThemedButton>
                  </>
                );
              }}
            />
          </View>
        </ThemedView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Exercises;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: screenWidth,
  },

  title: {
    fontSize: 18,
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    width: "100%",
    marginTop: 20,
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
  buttonCluster: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
