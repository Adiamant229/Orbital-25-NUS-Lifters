//react imports
import {
  StyleSheet,
  FlatList,
  View,
  Dimensions, Pressable, ScrollView,
} from "react-native";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import { useEffect, useState } from "react";
import { Searchbar } from "react-native-paper";
import ThemedButton from "../../components/themedButton";
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
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
  const [targets, setTargets] = useState(['']) //for filtering
  const [equipment, setEquipment] = useState([''])
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
        console.error("Error fetching exercises: ", err)
      }
    }
    fetchData();
  }, []);

  const searchName = (x) => {
    x = x.toLowerCase().trim();
    if (!x || x === lastSearched) {
      return;
    }
    setLastSearched(x);
    const searchUrl = baseURL + "name/" + x;
    const response = fetch(searchUrl, options);
    response.then((res) => res.json()).then((res) => setSearchRes(res));
  };

  const redirect = (mode, query) => {
    router.push({
      pathname: "/exercisesList",
      params: {mode,
        query,
      }
    });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        Exercises
      </ThemedText>

      <Spacer />
      <View style={{ flexDirection: "row" }}>
        <Searchbar
          placeholder={"Search Exercise"}
          onChangeText={setQuery}
          onSubmitEditing={() => searchName(query)}
          value={query}
          style={{ flex: 3 }}
        />
        <ThemedButton
          style={styles.searchButton}
          onPress={() => searchName(query)}
        >
          <View style={styles.searchContent}>
            <MaterialIcons size={24} name="search" color="#f2f2f2" />
          </View>
        </ThemedButton>
      </View>

      <View >
        {/* The Dropdown menu */}
        <Pressable onPress={() => setToggleRec(!toggleRec)}>
          <View style={{flexDirection:"row", alignSelf:"center"}}>
            <ThemedText>
              Recommended Menus
            </ThemedText>
            {toggleRec ? (<Ionicons name={"chevron-up-outline"} color={"white"}/>)
              : (<Ionicons name={"chevron-down-outline"} color={"white"}/>) }
          </View>
        </Pressable>
        {toggleRec && (<ScrollView style={{padding:20}}>
          <ThemedText>
            Targets
          </ThemedText>
          <View style={{flexDirection:"row", flexWrap:"wrap"}}>
            <>
              {targets.map((item, index) => (
                <ThemedButton key={index} onPress={() => redirect("target", item)}>
                  <ThemedText style={styles.text} key={index}>
                    {item}
                  </ThemedText>
                </ThemedButton>
              ))}
            </>
          </View>
          <ThemedText>
            Equipment
          </ThemedText>
          <View style={{flexDirection:"row", flexWrap:"wrap"}}>
            <>
              {equipment.map((item, index) => {
                return (
                  <ThemedButton key={index} onPress={() => redirect("target", item)}>
                    <ThemedText style={styles.text} key={index}>
                      {item}
                    </ThemedText>
                  </ThemedButton>
                );
              })}
            </>
          </View>
          <Spacer/>
        </ScrollView>)}
      </View>

      <View style={styles.listContainer}>
        <FlatList
          contentContainerStyle={{ alignContent: "center", width: "100%" }}
          data={searchRes}
          renderItem={({ item }) => {
            return (
              <>
                <ThemedButton
                  style={styles.results}
                  onPress={() => {
                    router.push({
                      pathname: "/exerciseInfo",
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
                  <ThemedText>
                    {capWords(item.name.split(" ")).join(" ")}
                  </ThemedText>
                </ThemedButton>
              </>
            );
          }}
        />
      </View>
    </ThemedView>
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
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    borderRadius: 10,
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
    backgroundColor: "rgba(218,244,240,0.3)",
    borderWidth: 1,
    borderColor: "rgba(182,220,221,0.2)",
  },
  resultText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonCluster: {
    flexDirection:"row",
    flexWrap:"wrap",
  }
});
