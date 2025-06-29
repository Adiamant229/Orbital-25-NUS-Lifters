//react and expo imports
import {
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
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
import {useEffect, useRef, useState} from "react";
import {APIKey} from "../../firebaseConfig";

const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;

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
    const manualSearchTrigger = useRef(false);

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

    const updateServings = (id) => {
        return (serving) => {
            serving = (Math.abs(parseInt(serving)));
            const updated = [...mealList];
            updated[id].servings = serving;
            setMealList(updated);
        };
    };

    const summation = (parameter) => {
        return (mealList.reduce((total, food) => {
            return total + (parseInt(food[parameter]) * food.id / 100);
        }, 0)).toFixed(2)
    };

    const deleteItem = (id) => {
        const updated = [...mealList].filter((item) => item.id !== id);
        setMealList(updated);
    }

    return (
            <SafeAreaView style={{flex:1}}>
                <ThemedView style={styles.container}>
                <ThemedText style={styles.title} title={true}>
                    Macro Tracker
                </ThemedText>

                <Spacer height={20}/>

                <ThemedButton style={styles.searchButton} onPress={() => setSearching(true)}>
                    <View style={styles.searchContent}>
                        <MaterialIcons size={24} name="search" color="#f2f2f2"/>
                        <Text style={styles.buttonText}>Search Food</Text>
                    </View>
                </ThemedButton>

                <Spacer height={20}/>

                <View style={styles.infoBox}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Energy:</Text>
                        <Text style={styles.value}>
                            {summation("calories")}
                             cal</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Protein:</Text>
                        <Text style={styles.value}>{summation("protein")}g</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fat:</Text>
                        <Text style={styles.value}>{summation("fat")}g</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Carbs:</Text>
                        <Text style={styles.value}>{summation("carbs")}g</Text>
                    </View>
                </View>
                    <Spacer/>
                <View style={styles.mealbox}>
                    {mealList.length < 1
                        ? (
                            <View style={{alignItems:'center', justifyContent:"center", flex:1}}>
                                <ThemedText style={{...styles.contentText, textAlign:"center"}}>Add foods with the "Search Food" Button!</ThemedText>
                            </View>
                        )
                        : (
                            <FlatList
                                data={mealList}
                                keyExtractor={(item) => item.id.toString()}
                                ItemSeparatorComponent={() => (
                                    <View
                                        style={{
                                            height: 1,
                                            backgroundColor: '#e0e0e0',
                                            marginHorizontal: 10,
                                        }}
                                    />
                                )}
                                renderItem={(item) => {
                                    return (
                                        <>
                                            <View style={styles.rowBox}>
                                                    <Text
                                                        style={styles.label}>{item?.item.description} </Text>
                                                    <Text
                                                        style={styles.value}>Calories: {(item?.item.calories * item?.item.servings / 100).toFixed(2)};
                                                        Fat: {(item?.item.fat * item?.item.servings / 100).toFixed(2)}; Protein: {(item?.item.protein * item?.item.servings / 100).toFixed(2)};
                                                        Carbohydrates: {(item?.item.carbs * item?.item.servings / 100).toFixed(2)}</Text>
                                                <View style={{justifyContent:"space-between", flexDirection:"row"}}>
                                                    <View style={{flexDirection:"row"}}>
                                                        <TextInput style={styles.textbox} keyboardType={"numeric"} defaultValue={"100"} onChangeText={updateServings(item.item.id)}/>
                                                        <Text style={styles.contentText}>g</Text>
                                                    </View>
                                                    <Pressable onPress={() => deleteItem(item.item.id)}>
                                                        <Ionicons name={"close-outline"} color={"red"} size={20}/>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        </>
                                    )
                                }}
                            />
                        )}
                </View>
                <Modal
                    visible={searching}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => {
                    }}
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
                                    {foodList.length >= 1 &&
                                        <View>
                                            <FlatList
                                                data={foodList}
                                                ItemSeparatorComponent={() => (
                                                    <View
                                                        style={{
                                                            height: 1,
                                                            backgroundColor: '#e0e0e0',
                                                            marginHorizontal: 10,
                                                        }}
                                                    />
                                                )}
                                                renderItem={(item) => {
                                                    return (
                                                        <>
                                                            <Pressable onPress={() => {
                                                                setSearching(false);
                                                                const wanted = {
                                                                    "Protein": "protein",
                                                                    "Carbohydrate, by difference": "carbs",
                                                                    "Energy": "calories",
                                                                    "Total lipid (fat)": "fat"
                                                                }
                                                                const mealItem = item.item.foodNutrients
                                                                    .filter(nutrient => wanted.hasOwnProperty(nutrient.nutrientName))
                                                                    .reduce((food, nutrient) => {
                                                                        food[wanted[nutrient.nutrientName]] = nutrient.value;
                                                                        return food;
                                                                    }, {
                                                                        description: item.item.description,
                                                                        servings: 100
                                                                    });
                                                                const newMealList = [...mealList, mealItem].map((item, index) => ({
                                                                    ...item,
                                                                    id:index
                                                                }));
                                                                setMealList(newMealList);
                                                            }}>
                                                                <View style={styles.resultsBox}>
                                                                    <ThemedText
                                                                        style={{color: 'black'}}> {item?.item.description} </ThemedText>
                                                                </View>
                                                            </Pressable>
                                                        </>
                                                    )
                                                }}
                                            />
                                        </View>
                                    }
                                </View>
                            </TouchableWithoutFeedback>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </Modal>
        </ThemedView>
            </SafeAreaView>
    );
};

export default Macro;

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

    searchButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    searchContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    buttonText: {
        color: "#f2f2f2",
        fontSize: 16,
        fontWeight: "600",
    },

    infoBox: {
        width: "100%",
        marginTop: 30,
        backgroundColor: "#eee",
        padding: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
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
        width:"100%",
        flex:1,
        padding: 10,
        justifyContent:"space-between",
        backgroundColor: "#eee",
        borderRadius: 12,
    },
    rowBox: {
        padding:10,
        justifyContent: "space-between",
    },
    contentText: {
        fontSize:16,
        color:'black',
        fontStyle: "normal"
    },
    textbox: {
        backgroundColor:'rgba(52,52,52,0.1)',
        color:"black",
        paddingHorizontal:4,
        width:"auto",
        fontSize:16,
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
        padding: 20
    },
    resultsText: {
        flex: 1
    }
});
