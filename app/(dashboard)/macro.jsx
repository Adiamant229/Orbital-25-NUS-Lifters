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
    TouchableWithoutFeedback,
    View
} from "react-native";
import {Searchbar} from "react-native-paper";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
import {useEffect, useState} from "react";
import {APIKey} from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const searchOptions = (query) => {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            "dataType": [
                "Foundation", "SR Legacy", "Survey (FNDDS)"
            ],
            "pageSize": 25,
        })
    }
}

const searchDB = async (query) => {
    try {
        const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${APIKey}`, searchOptions(query));
        const data = await response.json();
        return data?.foods || [];
    } catch (err) {
        console.error("Search Error: ", err);
        return [];
    }
}
const Macro = () => {
    const [searching, setSearching] = useState(false); //modal controller
    const [foodList, setFoodList] = useState([]); //search results to be rendered
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [mealList, setMealList] = useState([]);

    useEffect(() => {
        const loadMealList = async () => {
                AsyncStorage.getItem('mealList')
                    .then(data => {
                        if (data) {
                            setMealList(JSON.parse(data))
                        }
                    }).catch(err => console.error('Failed to load meal list:', err));
        }
        loadMealList();
    }, []);

    useEffect(() => {
        const typingTimeout = setTimeout(() => {
            setDebounced(query);
        }, 500)
        return () => clearTimeout((typingTimeout));
    }, [query]);
    useEffect(() => {
        if (debounced && debounced.length >= 3) {
            searchDB(debounced).then(data => {
                setFoodList(data);
            }).catch((err) => console.error("Retrieval error: ", err));
        }
    }, [debounced]);

    useEffect(() => {
        const saveMealList = () => {
            try {
                AsyncStorage.setItem('mealList', JSON.stringify(mealList));
            } catch (err) {
                console.error('Persistence Error: ', err);
            }
        }
        saveMealList();
    }, [mealList]);

    const updateServings = (id) => {
      return (serving) => {
        const updated = mealList.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              servings: Math.abs(parseInt(serving) || 0),
            };
          }
          return item;
        });
        setMealList(updated);
      };
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
        const updated = [...mealList].filter((item) => item.id !== id);
        setMealList(updated);
    }

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
              <ThemedText>Search Food</ThemedText>
            </View>
          </ThemedButton>

          <View style={styles.infoBox}>
            <View style={styles.row}>
              <Text style={styles.label}> Total Calories:</Text>
              <Text style={styles.value}>
                {summation("calories")}
                cal
              </Text>
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
          </View>
          <Spacer />
          <View style={styles.mealbox}>
            {mealList.length < 1 ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <ThemedText style={{ color: "black", textAlign: "center" }}>
                  Add foods with the "Search Food" Button!
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={mealList}
                keyExtractor={(item) => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#e0e0e0",
                      marginHorizontal: 10,
                    }}
                  />
                )}
                renderItem={({ item }) => (
                  <TouchableWithoutFeedback>
                    <View style={styles.contentCards}>
                      <ThemedText style={styles.label}>
                        {item.description}
                      </ThemedText>
                      <ThemedText style={styles.value}>
                        Calories:{" "}
                        {((item.calories * item.servings) / 100).toFixed(2)};
                        Fat: {((item.fat * item.servings) / 100).toFixed(2)};
                        Protein:{" "}
                        {((item.protein * item.servings) / 100).toFixed(2)};
                        Carbs: {((item.carbs * item.servings) / 100).toFixed(2)}
                      </ThemedText>

                      {/* Input row */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <TextInput
                            style={styles.textbox}
                            keyboardType="numeric"
                            value={String(item.servings)}
                            onChangeText={updateServings(item.id)}
                          />
                          <ThemedText style={styles.contentText}>g</ThemedText>
                        </View>

                        <Pressable onPress={() => deleteItem(item.id)}>
                          <Ionicons
                            name={"close-outline"}
                            color={"red"}
                            size={24}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              />
            )}
          </View>
          <Modal
            visible={searching}
            animationType="fade"
            transparent={true}
            onRequestClose={() => {}}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setSearching(false);
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalBackdrop}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.modalContainer}>
                    <Searchbar
                      placeholder={"Search Food"}
                      onChangeText={setQuery}
                      value={query}
                    />
                    {foodList.length >= 1 && (
                      <View>
                        <FlatList
                          data={foodList}
                          ItemSeparatorComponent={() => (
                            <View
                              style={{
                                height: 1,
                                backgroundColor: "#e0e0e0",
                                marginHorizontal: 10,
                              }}
                            />
                          )}
                          renderItem={(item) => {
                            return (
                              <>
                                <Pressable
                                  onPress={() => {
                                    setSearching(false);
                                    const wanted = {
                                      Protein: "protein",
                                      "Carbohydrate, by difference": "carbs",
                                      Energy: "calories",
                                      "Total lipid (fat)": "fat",
                                    };
                                    const mealItem = item.item.foodNutrients
                                      .filter((nutrient) =>
                                        wanted.hasOwnProperty(
                                          nutrient.nutrientName
                                        )
                                      )
                                      .reduce(
                                        (food, nutrient) => {
                                          food[wanted[nutrient.nutrientName]] =
                                            nutrient.value;
                                          return food;
                                        },
                                        {
                                          description: item.item.description,
                                          servings: 100,
                                        }
                                      );
                                    const newMealList = [
                                      ...mealList,
                                      mealItem,
                                    ].map((item, index) => ({
                                      ...item,
                                      id: index,
                                    }));
                                    setMealList(newMealList);
                                  }}
                                >
                                  <View style={styles.resultsBox}>
                                    <ThemedText style={{ color: "black" }}>
                                      {" "}
                                      {item?.item.description}{" "}
                                    </ThemedText>
                                  </View>
                                </Pressable>
                              </>
                            );
                          }}
                        />
                      </View>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
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
    paddingTop: 70,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "150",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  searchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  buttonText: {
    color: "#f2f2f2",
    fontSize: 16,
    fontWeight: "600",
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
  rowBox: {
    padding: 10,
    justifyContent: "space-between",
  },
  contentText: {
    fontSize: 16,
  },
  contentCards: {
    backgroundColor: "#2196f3",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  textbox: {
    backgroundColor: "blue",
    color: "white",
    paddingHorizontal: 4,
    width: "auto",
    fontSize: 16,
    borderRadius: 18,
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
  resultsText: {
    flex: 1,
  },
});
