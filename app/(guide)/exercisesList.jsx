import {useEffect, useState} from "react";
import {useLocalSearchParams} from "expo-router";
import ThemedView from "../../components/themedView";
import {FlatList, Pressable, View, StyleSheet, Dimensions} from "react-native";
import ThemedText from "../../components/themedText";
import { useRouter } from "expo-router";

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

export default function exercisesList() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params?.mode;
  const query = params?.query;
  const [searchRes, setSearchRes] = useState([]);
  useEffect(() => {
    const searchDB = () => {
      if (mode === 'target') {
        const searchUrl = baseURL + 'target/' + query;
        const response = fetch(searchUrl, options);
        response.then((res) => res.json()).then((res) => setSearchRes(res))
      } else if (mode === 'equipment') {
        const searchUrl = baseURL + 'equipment/' + query;
        const response = fetch(searchUrl, options);
        response.then((res) => res.json()).then((res) => setSearchRes(res))
      }
    }
    searchDB();
  }, [])
  return (
    <ThemedView>
      <FlatList
        data={searchRes}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{alignContent:"center", height:screenHeight}}
        renderItem={({item}) => {
          return (<>
            <Pressable onPress={() => {
              console.log(item);
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
            }}>
                <ThemedText style={{padding:20, textAlign:"center"}}>{item?.name}</ThemedText>
            </Pressable>
          </>);
        }}
      />
    </ThemedView>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: screenWidth,
    height: screenHeight,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 10,
  },
})
