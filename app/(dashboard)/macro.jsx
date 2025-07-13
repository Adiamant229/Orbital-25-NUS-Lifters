//react and expo imports
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert
} from "react-native";
import { useEffect, useState } from "react";
import { Searchbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

//firebase imports
import { APIKey } from "../../firebaseConfig";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";

const searchOptions = (query) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query,
    dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
    pageSize: 25,
  }),
});

const searchDB = async (query) => {
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${APIKey}`,
      searchOptions(query)
    );
    const data = await response.json();
    return data?.foods || [];
  } catch (err) {
    console.error("Search Error: ", err);
    return [];
  }
};

const Macro = () => {
  const [searching, setSearching] = useState(false);
  const [foodList, setFoodList] = useState([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mealList, setMealList] = useState([]);
  const [servingInputs, setServingInputs] = useState({});
  const router = useRouter();

  useEffect(() => {
    const loadMealList = async () => {
      try {
        const data = await AsyncStorage.getItem("mealList");
        if (data) setMealList(JSON.parse(data));
      } catch (err) {
        console.error("Failed to load meal list:", err);
      }
    };
    loadMealList();
  }, []);

  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setDebounced(query);
    }, 500);
    return () => clearTimeout(typingTimeout);
  }, [query]);

  useEffect(() => {
    if (debounced && debounced.length >= 3) {
      searchDB(debounced)
        .then(setFoodList)
        .catch((err) => console.error("Retrieval error: ", err));
    }
  }, [debounced]);

  useEffect(() => {
    try {
      AsyncStorage.setItem("mealList", JSON.stringify(mealList));
    } catch (err) {
      console.error("Persistence Error: ", err);
    }
  }, [mealList]);

  useEffect(() => {
    const inputs = {};
    mealList.forEach((item) => {
      inputs[item.id] = String(item.servings);
    });
    setServingInputs(inputs);
  }, [mealList.length]);

  const updateServings = (id) => (text) => {
    if (text.startsWith(".")) {
      text = "0" + text;
    }

    const validFormat = /^\d*(\.\d{0,2})?$/;

    if (text === "" || validFormat.test(text)) {
      setServingInputs((prev) => ({
        ...prev,
        [id]: text,
      }));

      const numeric = parseFloat(text);
      if (!isNaN(numeric)) {
        const updated = mealList.map((item) =>
          item.id === id ? { ...item, servings: Math.abs(numeric) } : item
        );
        setMealList(updated);
      }
    }
  };

  const summation = (parameter) => {
    return mealList
      .reduce((total, food) => {
        const valuePer100g = parseFloat(food[parameter]) || 0;
        const servings = parseFloat(food.servings) || 0;
        return total + (valuePer100g * servings) / 100;
      }, 0)
      .toFixed(2);
  };

const deleteItem = (id) => {
  Alert.alert("Delete Meal", "Are you sure you want to delete this meal?", [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Delete",
      style: "destructive",
      onPress: () => {
        const updated = mealList.filter((item) => item.id !== id);
        setMealList(updated);
      },
    },
  ]);
};


  const handleSendToProgress = () => {
    router.push({
      pathname: "/progressTracker",
      params: {
        importedMacro: "true",
        importedSelectedTab: "Macros",
        importedCalories: summation("calories"),
        importedProtein: summation("protein"),
        importedFat: summation("fat"),
        importedCarbs: summation("carbs"),
      },
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title} title={true}>
          Macro Tracker
        </ThemedText>

        <ThemedButton
          style={styles.searchButton}
          onPress={() => setSearching(true)}
        >
          <View style={styles.searchContent}>
            <MaterialIcons size={24} name="search" color="#f2f2f2" />
            <ThemedText style={{ color: "white" }}>Search Food</ThemedText>
          </View>
        </ThemedButton>

        <View style={styles.headerRow}>
          <ThemedText style={styles.subtitle}>
            Your Macros of the Day
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push("/calories")}
            style={styles.guideButton}
          >
            <FontAwesome5 name="book-open" size={15} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Total Calories:</Text>
            <Text style={styles.value}>{summation("calories")} cal</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Protein:</Text>
            <Text style={styles.value}>{summation("protein")}g</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Fat:</Text>
            <Text style={styles.value}>{summation("fat")}g</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Carbs:</Text>
            <Text style={styles.value}>{summation("carbs")}g</Text>
          </View>
          <ThemedButton
            onPress={handleSendToProgress}
            style={styles.sendButton}
          >
            <ThemedText style={{ color: "white" }}>
              Save to Progress Tracker
            </ThemedText>
          </ThemedButton>
        </View>

        <Spacer />
        <ThemedText style={styles.sectionTitle}>Your Meals</ThemedText>

        <View style={styles.mealbox}>
          {mealList.length < 1 ? (
            <View style={styles.emptyBox}>
              <ThemedText style={{ color: "black", textAlign: "center" }}>
                Add foods with the "Search Food" Button!
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={mealList}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableWithoutFeedback>
                  <View style={styles.contentCards}>
                    <ThemedText style={styles.label}>
                      {item.description}
                    </ThemedText>
                    <ThemedText style={styles.value}>
                      Calories:{" "}
                      {((item.calories * item.servings) / 100).toFixed(2)}; Fat:{" "}
                      {((item.fat * item.servings) / 100).toFixed(2)}; Protein:{" "}
                      {((item.protein * item.servings) / 100).toFixed(2)};
                      Carbs: {((item.carbs * item.servings) / 100).toFixed(2)}
                    </ThemedText>
                    <View style={styles.inputRow}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <TextInput
                          style={styles.textbox}
                          keyboardType="decimal-pad"
                          value={
                            servingInputs[item.id] ?? String(item.servings)
                          }
                          onChangeText={updateServings(item.id)}
                        />
                        <ThemedText style={styles.contentText}>g</ThemedText>
                      </View>
                      <Pressable onPress={() => deleteItem(item.id)}>
                        <Ionicons name="trash-outline" color="red" size={24} />
                      </Pressable>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              )}
            />
          )}
        </View>

        {/* Modal */}
        <Modal
          visible={searching}
          animationType="fade"
          transparent
          onRequestClose={() => setSearching(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setSearching(false);
            }}
          >
            <View style={styles.modalBackdrop}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 40 : 0}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.modalContainer}>
                    <Searchbar
                      placeholder="Search Food"
                      onChangeText={setQuery}
                      value={query}
                    />
                    {foodList.length >= 1 && (
                      <View style={{ maxHeight: 300, flexShrink: 1 }}>
                        <FlatList
                          data={foodList}
                          keyboardShouldPersistTaps="handled"
                          ItemSeparatorComponent={() => (
                            <View style={styles.separator} />
                          )}
                          renderItem={({ item }) => (
                            <Pressable
                              onPress={() => {
                                setSearching(false);
                                const wanted = {
                                  Protein: "protein",
                                  "Carbohydrate, by difference": "carbs",
                                  Energy: "calories",
                                  "Total lipid (fat)": "fat",
                                };
                                const mealItem = item.foodNutrients
                                  .filter((nutrient) =>
                                    wanted.hasOwnProperty(nutrient.nutrientName)
                                  )
                                  .reduce(
                                    (food, nutrient) => {
                                      food[wanted[nutrient.nutrientName]] =
                                        nutrient.value;
                                      return food;
                                    },
                                    {
                                      description: item.description,
                                      servings: 100,
                                    }
                                  );
                                const newMealList = [...mealList, mealItem].map(
                                  (item, index) => ({
                                    ...item,
                                    id: index,
                                  })
                                );
                                setMealList(newMealList);
                              }}
                            >
                              <View style={styles.resultsBox}>
                                <ThemedText style={{ color: "black" }}>
                                  {item.description}
                                </ThemedText>
                              </View>
                            </Pressable>
                          )}
                        />
                      </View>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Macro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 75,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginRight: 230,
    marginBottom: 5,
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "150",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  searchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  guideButton: {
    backgroundColor: "#2196f3",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    width: 37,
    height: 35,
  },
  infoBox: {
    width: "100%",
    marginTop: 10,
    backgroundColor: "#eee",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 250,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  mealbox: {
    width: "100%",
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
    backgroundColor: "#eee",
    borderRadius: 12,
  },
  contentCards: {
    backgroundColor: "#2196f3",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  textbox: {
    backgroundColor: "blue",
    color: "white",
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 60,
    fontSize: 16,
    borderRadius: 18,
    textAlign: "center",
  },
  contentText: {
    fontSize: 16,
    marginLeft: 6,
    color: "#fff",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  resultsBox: {
    flex: 1,
    padding: 20,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 10,
  },
});
