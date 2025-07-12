import { useLocalSearchParams } from "expo-router";
import { exerciseAPIKey } from "../../firebaseConfig";

const baseURL = "https://exercisedb.p.rapidapi.com/";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": exerciseAPIKey,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};
export default function exerciseSearchRes() {}
