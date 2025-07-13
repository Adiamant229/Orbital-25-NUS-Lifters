//react imports
import {
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  View,
  Pressable,
} from "react-native";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedCard from "../../components/themedCard";
import Spacer from "../../components/spacer";
import { exerciseAPIKey } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { Searchbar } from "react-native-paper";
import ThemedButton from "../../components/themedButton";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const baseURL = "https://exercisedb.p.rapidapi.com/";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": exerciseAPIKey,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};

const router = useRouter();
const Exercises = () => {
  //const [targets, setTargets] = useState([]); //for filtering
  //const [equipment, setEquipment] = useState([])
  const [searchRes, setSearchRes] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const targetsUrl = baseURL + "targetList";
    const equipmentUrl = baseURL + "equipmentList";
    let response = fetch(targetsUrl, options);
    response.then((res) => res.json()).then((res) => setTargets(res));
    response = fetch(equipmentUrl, options);
    response.then((res) => res.json()).then((res) => setEquipment(res));
  }, []);

  const searchName = (x) => {
    x = x.toLowerCase();
    const searchUrl = baseURL + "exercises/name/" + x;
    const response = fetch(searchUrl, options);
    response
      .then((res) => res.json())
      .then((res) => setSearchRes(res))
      .then(() => console.log(searchRes));
  };

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
      <FlatList
        style={{ flex: 1 }}
        data={searchRes}
        renderItem={({ item }) => {
          return (
            <>
              <Pressable
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
                <ThemedText>{item.name}</ThemedText>
              </Pressable>
            </>
          );
        }}
      />
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

  cardTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },

  cardDescription: {
    fontSize: 12,
  },
  searchButton: {},
});
