//react and expo imports 
import { StyleSheet } from "react-native";

//themed components 
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import Spacer from "../../components/spacer";

const MpshReports = () => {
  return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText style={styles.title} title={true}>
        {" "}
        - Leg press machine down 2
      </ThemedText>
      <ThemedText style={styles.title} title={true}>
        {" "}
        - Smith machine under maintenance
      </ThemedText>
    </ThemedView>
  );
};

export default MpshReports;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "top",
    justifyContent: "top",
  },

  title: {
    fontWeight: "bold",
    fontSize: 18,
  },
});
