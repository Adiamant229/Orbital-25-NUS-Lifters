import {useLocalSearchParams} from "expo-router";
import ThemedText from "../../components/themedText";
import {exerciseAPIKey} from "../../firebaseConfig";
import {Image, StyleSheet, Dimensions} from "react-native";
import ThemedView from "../../components/themedView";

const imgURL = `https://exercisedb.p.rapidapi.com/image?resolution=180&rapidapi-key=${exerciseAPIKey}`;
const screenWidth = Dimensions.get("window").width;
export default function exerciseInfo()
{
    const capWords = (x) => {
        for (let i = 0; i < x.length; i++) {
            x[i] = x[i].charAt(0).toUpperCase() + x[i].substring(1);
        }
        return x;
    }
    const params = useLocalSearchParams();
    const name = capWords(params?.name.split(" ")).join(" ");
    const description = params?.description;
    const id = params?.id;
    const equipment = params?.equipment;
    const bodyPart = params?.bodyPart;
    const secondaryMuscles = capWords((params?.secondaryMuscles || "").split(","));
    const instructions = JSON.parse(decodeURIComponent(params?.instructions));

    return (
        <>
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>{name}</ThemedText>
                <Image source={{uri:imgURL+"&exerciseId="+id}} style={{width:screenWidth, height:screenWidth}}/>
                <ThemedText>{description}</ThemedText>
                <ThemedText>Equipment: {equipment}; targets: {bodyPart}; Secondary Muscles: {secondaryMuscles.join(', ')}</ThemedText>
                <ThemedText>Instructions</ThemedText>
                {instructions.map((item, index) => {
                    return (<ThemedText key={item}>{index + 1}: {item}</ThemedText>)
                })}
            </ThemedView>
        </>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },

    title: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 20,
    },
})
