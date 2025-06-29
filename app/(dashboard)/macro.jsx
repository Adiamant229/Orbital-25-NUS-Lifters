//react and expo imports
import {
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform, Pressable, SafeAreaView, ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableWithoutFeedback,
    View
} from "react-native";
import {Searchbar} from "react-native-paper";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import ThemedButton from "../../components/themedButton";
import {MaterialIcons} from "@expo/vector-icons";
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
    const summation = (parameter) => {
        return mealList.reduce((total, food) => {
            return total + parseInt(food[parameter]);
        }, 0)
    }

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

    return (
            <SafeAreaView style={{flex:1}}>
                <ThemedView style={styles.container}>
                <ThemedText style={styles.title} title={true}>
                    Macro Tracker
                </ThemedText>

                <Spacer/>

                <ThemedButton style={styles.searchButton} onPress={() => setSearching(true)}>
                    <View style={styles.searchContent}>
                        <MaterialIcons size={24} name="search" color="#f2f2f2"/>
                        <Text style={styles.buttonText}>Search Food</Text>
                    </View>
                </ThemedButton>

                <Spacer/>

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
                <View style={styles.mealbox}>
                    {mealList.length < 1
                        ? (
                            <ThemedText style={styles.emptyText}>Add foods with the "Search" Button!</ThemedText>
                        )
                        : (
                            <FlatList
                                data={mealList}
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
                                                <View>
                                                    <ThemedText
                                                        style={{color: 'white'}}> {item?.item.description} </ThemedText>
                                                    <ThemedText
                                                        style={{color: 'white'}}> Calories: {item?.item.calories};
                                                        Fat: {item?.item.fat}; Protein: {item?.item.protein};
                                                        Carbohydrates: {item?.item.carbs}</ThemedText>
                                                </View>
                                                {/*<TextInput style={{color:'white', backgroundColor:'grey', width:40}} defaultValue={'100'}/>*/}
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
                                                                        food[wanted[nutrient.nutrientName]] = nutrient.nutrientNumber
                                                                        return food;
                                                                    }, {
                                                                        description: item.item.description,
                                                                        serving: 100
                                                                    });
                                                                setMealList(prev => [...prev, mealItem])
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
        flex:1,
        padding: 10,
        justifyContent:"space-between"
    },
    rowBox: {
        justifyContent: "space-between"
    },
    emptyText: {
        alignItems: "center",
        padding: 30
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
