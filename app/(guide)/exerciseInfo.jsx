import { useLocalSearchParams } from "expo-router";
import ThemedText from "../../components/themedText";
import { exerciseAPIKey } from "../../firebaseConfig";
import { Image, StyleSheet, Dimensions, ScrollView } from "react-native";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";
import { capWords } from "../index";

const imgURL = `https://exercisedb.p.rapidapi.com/image?resolution=180&rapidapi-key=${exerciseAPIKey}`;
const screenWidth = Dimensions.get("window").width;
export default function exerciseInfo() {
  const params = useLocalSearchParams();
  const name = capWords(params?.name.split(" ")).join(" ");
  const description = params?.description;
  const id = params?.id;
  const equipment = params?.equipment;
  const bodyPart = params?.bodyPart;
  const secondaryMuscles = capWords(
    (params?.secondaryMuscles || "").split(","),
  );
  const instructions = JSON.parse(decodeURIComponent(params?.instructions));

  return (
    <>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText style={styles.title}>{name}</ThemedText>
          <Spacer />
          <Image
            source={{ uri: imgURL + "&exerciseId=" + id }}
            style={{ width: "80%", aspectRatio: 1, alignSelf: "center" }}
          />
          <Spacer />
          <ThemedText style={styles.text}>{description}</ThemedText>
          <ThemedText style={styles.text}> Equipment: {equipment}</ThemedText>
          <ThemedText style={styles.text}>Targets: {bodyPart};</ThemedText>
          <ThemedText style={styles.text}>
            Secondary Muscles: {secondaryMuscles.join(", ")}
          </ThemedText>
          <ThemedText style={styles.text}>Instructions</ThemedText>
          {instructions.map((item, index) => {
            return (
              <ThemedText style={styles.text} key={item}>
                {index + 1}: {item}
              </ThemedText>
            );
          })}
        </ScrollView>
      </ThemedView>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  scrollContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    marginBottom: 20,
    textAlign: "justify",
    fontSize: 16,
  },
});
