//react imports
import {
    StyleSheet,
    Image,
    ScrollView,
    FlatList,
    View,
    Pressable, Dimensions,
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

const screenWidth = Dimensions.get("window").width;
const baseURL = "https://exercisedb.p.rapidapi.com/";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": exerciseAPIKey,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};

const Exercises = () => {
    const router = useRouter();
  //const [targets, setTargets] = useState([]); //for filtering
  //const [equipment, setEquipment] = useState([])
  const [searchRes, setSearchRes] = useState([]);
  const [query, setQuery] = useState("");
  const [lastSearched, setLastSearched] = useState("")

  useEffect(() => {
    const targetsUrl = baseURL + "targetList";
    const equipmentUrl = baseURL + "equipmentList";
    let response = fetch(targetsUrl, options);
    response.then((res) => res.json()).then((res) => setTargets(res));
    response = fetch(equipmentUrl, options);
    response.then((res) => res.json()).then((res) => setEquipment(res));
  }, []);

  const searchName = (x) => {
    x = x.toLowerCase().trim();
    if (!x || x === lastSearched) {
        return;
    }
    setLastSearched(x);
    const searchUrl = baseURL + "exercises/name/" + x;
    const response = fetch(searchUrl, options);
    response
      .then((res) => res.json())
      .then((res) => setSearchRes(res))
  };
    const capWords = (x) => {
      for (let i = 0; i < x.length; i++) {
          x[i] = x[i].charAt(0).toUpperCase() + x[i].substring(1);
      }
        return x;
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
        <View style={styles.listContainer}>
      <FlatList
        contentContainerStyle={{alignContent:"center", width:"100%"}}
        data={searchRes}
        renderItem={({ item }) => {
          return (
            <>
                  <ThemedButton style={styles.results} onPress={()=> {
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
                    <ThemedText>{capWords(item.name.split(" ")).join(" ")}</ThemedText>
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
      width:screenWidth
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
        backgroundColor:'rgba(218,244,240,0.3)',
        borderWidth:1,
        borderColor:"rgba(182,220,221,0.2)"
    },
    resultText: {
        fontWeight: "bold",
        textAlign: "center",
    }

});
