import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
  Dimensions,
} from "react-native";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import { useState } from "react";
import Spacer from "../../components/spacer";
import ThemedTextInput from "../../components/themedTextInput";
import ThemedButton from "../../components/themedButton";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

const calories = () => {
  const [mode, setMode] = useState("mifflin");
  const [sex, setSex] = useState(1);

  const [height, setHeight] = useState("0");
  const [errHeight, setErrHeight] = useState(false);
  const setHeightTemp = (x) => {
    setHeight(x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"));
  };

  const [weight, setWeight] = useState("0");
  const [errWeight, setErrWeight] = useState(false);
  const setWeightTemp = (x) => {
    setWeight(x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"));
  };
  const [age, setAge] = useState("0");
  const [errAge, setErrAge] = useState(false);
  const setAgeTemp = (x) => {
    setAge(x.replace(/[^0-9]/g, ""));
  };
  const [fat, setFat] = useState("0");
  const [errFat, setErrFat] = useState(false);
  const setFatTemp = (x) => {
    setFat(x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"));
  };
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [physicalActivityLevel, setPhysicalActivityLevel] = useState("1");
  const setPALTemp = (x) => {
    setPhysicalActivityLevel(
      x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"),
    );
  };

  const [toggletdee, settoggletdee] = useState(false);
  const [toggletdeeres, setToggletdeeres] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [errWork, setErrWork] = useState(false);
  const [errLeisure, setErrLeisure] = useState(false);
  const [leisureVal, setLeisureVal] = useState(0);
  const [workVal, setWorkVal] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const [showModeDescription, setShowModeDescription] = useState(false);
  const [showTdeeDescription, setShowTdeeDescription] = useState(false);
  const [showPalDescription, setShowPalDescription] = useState(false);

  const description =
    "There are 2 main body composition strategies: cutting and bulking. Cutting involves reducing body fat while maintaining muscle mass, while bulking involves increasing muscle mass, regardless of fat gain. Cutting involves eating in a calorie deficit, while bulking involves eating in a calorie surplus, both relative to one\'s maintenance calories.\n" +
    "Eating with too large of a calorie deficit or surplus may lead hinder one\'s progress, such as losing excessive muscle mass or gaining disproportionate amounts of body fat to muscle mass. A slower cut/bulk with a smaller deficit/surplus of 10-15\% of your Total Daily Energy Expenditure (TDEE) is commonly used.\n" +
    "Calculate your calorie needs with our calculator!";
  const modeDescription =
    "Two equations are mainly used to calculate Basal Metabolic Rate (BMR), the energy your body needs to function at a basic level. They are: the Mifflin St-Jeor Equation and the Katch-McArdle Equation. The Mifflin St-Jeor Equation is more commonly used, while the Katch-McArdle Equation is more accurate by using body fat percentages, depending on the accuracy of the method of measuring it. It is also generally more accurate for athletic/lean individuals.";
  const tdeeDescription =
    "The Total Daily Energy Expenditure, which is an estimation of the energy burned by your body taking into account your physical activity.";
  const palDescription =
    "A factor to be multiplied to your BMR, calculated from your activity during work and leisure time.";

  const workActivity = [
    { label: "Please Select Activity Level", value: 0 },
    { label: "Very Light", value: 1 },
    { label: "Light", value: 2 },
    { label: "Moderate", value: 3 },
    { label: "Heavy", value: 4 },
  ];

  const workActivityDescriptions = [
    "",
    "Sitting at the computer most of the day, or sitting at a desk.",
    "Light industrial work, sales or office work that comprises light activities.",
    "Cleaning, kitchen staff, or delivering mail on foot or by bicycle.",
    "Heavy industrial work, construction work or farming.",
  ];

  const leisureActivity = [
    ...workActivity.slice(0, 4),
    { label: "Active", value: 4 },
    { label: "Very Active", value: 5 },
  ];

  const leisureActivityDescription = [
    "",
    "Almost no activity at all.",
    "Walking, non-strenuous cycling or gardening approximately once a week.",
    "Regular activity at least once a week, e.g., walking, bicycling (including to work) or gardening.",
    "Regular activities more than once a week, e.g., intense walking, bicycling or sports.",
    "Strenuous activities several times a week.",
  ];

  const resetDefault = () => {
    setMode("mifflin");
    setSex(1);
    setHeight("0");
    setAge("0");
    setFat("-1");
    setBmr(0);
    setTdee(0);
    settoggletdee(false);
    setToggletdeeres(false);
    setModalVisible(false);
  };

  const mifflinBMRCalc = (sex, weight, height, age) => {
    /*
        Mifflin-St. Jeor Equation:
        More accurate
        sex: 0: female; 1: male
         */
    return Math.round(
      10 * weight +
        6.25 * height -
        5 * age +
        ((sex + 1) % 2) * -161 +
        (sex % 2) * 5,
    );
  };

  const katchBMRCalc = (sex, weight, height, age, fat = -1) => {
    /*
        Katch-McArdle Eqn:
        More accurate for lean/ athletic individuals,
        sex -> 0: female; 1: male;
         */
    const lbm = () => {
      if (fat > 0) {
        return weight * (1 - fat / 100);
      } else if (sex === 1) {
        return 0.407 * weight + 0.267 * height - 19.2;
      } else if (sex === 0) {
        return 0.252 * weight + 0.473 * height - 48.3;
      }
    };
    return Math.round(370 + 21.6 * lbm());
  };

  const calculateActivityLevel = (work, leisure) => {
    return (1.18 + work * 0.08 + (0.11 + work * 0.01) * leisure).toFixed(2);
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ width: screenWidth, flex: 1 }}
      >
        <ThemedView style={styles.container}>
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}
            >
              <ThemedText style={styles.title} title={true}>
                Calorie Calculator
              </ThemedText>
              <View style={{ height: 100 }}>
                <ScrollView style={styles.faqBox}>
                  <ThemedText style={styles.faqTxt}>{description}</ThemedText>
                </ScrollView>
              </View>
              <View style={styles.qnBox}>
                <View style={{ width: 120, padding: 10, flexDirection: "row" }}>
                  <ThemedText style={{ textAlign: "right" }}>Mode</ThemedText>
                  <Pressable
                    onPress={() => setShowModeDescription(!showModeDescription)}
                  >
                    <Ionicons name="help-circle-outline" size={15} color={"white"}/>
                  </Pressable>
                </View>
                <View style={styles.options}>
                  <TouchableOpacity
                    onPress={() => setMode("mifflin")}
                    style={[
                      styles.addButton,
                      mode === "mifflin" && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText>Mifflin-St Jeor</ThemedText>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setMode("katch")}
                    style={[
                      styles.addButton,
                      mode === "katch" && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText>Katch-McArdle</ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              {showModeDescription && (
                <View style={{ height: 100 }}>
                  <ScrollView style={styles.faqBox}>
                    <ThemedText style={styles.faqTxt}>
                      {modeDescription}
                    </ThemedText>
                  </ScrollView>
                </View>
              )}
              <View style={styles.qnBox}>
                <ThemedText style={styles.qnTxt}>Biological Sex</ThemedText>
                <TouchableOpacity
                  onPress={() => setSex(1)}
                  style={[styles.addButton, sex === 1 && styles.selectedButton]}
                >
                  <View style={styles.buttonicons}>
                    <ThemedText>Male</ThemedText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSex(0)}
                  style={[styles.addButton, sex === 0 && styles.selectedButton]}
                >
                  <View style={styles.buttonicons}>
                    <ThemedText>Female</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.qnBox}>
                <ThemedText style={styles.qnTxt}>Age (in years)</ThemedText>
                <ThemedTextInput
                  keyboardType={"number-pad"}
                  onChangeText={setAgeTemp}
                  value={age}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.qnBox}>
                <ThemedText>Height (in cm)</ThemedText>
                <ThemedTextInput
                  keyboardType={"number-pad"}
                  onChangeText={setHeightTemp}
                  value={height}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.qnBox}>
                <ThemedText>Weight (in kg)</ThemedText>
                <ThemedTextInput
                  keyboardType={"decimal-pad"}
                  onChangeText={setWeightTemp}
                  value={weight}
                  style={styles.textInput}
                />
              </View>
              {mode === "katch" && (
                <View style={styles.qnBox}>
                  <ThemedText>Fat(%)</ThemedText>
                  <ThemedTextInput
                    keyboardType={"decimal-pad"}
                    onChangeText={setFatTemp}
                    value={fat}
                    style={styles.textInput}
                  />
                </View>
              )}
              <View style={styles.qnBox}>
                <ThemedText style={styles.qnTxt}>Calculate TDEE</ThemedText>
                <TouchableOpacity
                  onPress={() => settoggletdee(0)}
                  style={[
                    styles.addButton,
                    toggletdee === 0 && styles.selectedButton,
                  ]}
                >
                  <View style={styles.buttonicons}>
                    <ThemedText>No</ThemedText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => settoggletdee(1)}
                  style={[
                    styles.addButton,
                    toggletdee === 1 && styles.selectedButton,
                  ]}
                >
                  <View style={styles.buttonicons}>
                    <ThemedText>Yes</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
              {toggletdee === 1 && (
                <>
                  <View style={styles.qnBox}>
                    <ThemedText style={styles.qnTxt}>
                      Physical Activity Level
                    </ThemedText>
                    <View style={{ flexDirection: "row" }}>
                      <ThemedTextInput
                        onChangeText={setPALTemp}
                        value={physicalActivityLevel}
                        keyboardType={"decimal-pad"}
                        style={{ ...styles.textInput, flex: 1 }}
                      />
                      <ThemedButton
                        onPress={() => setModalVisible(true)}
                        style={{ flex: 1 }}
                      >
                        <ThemedText>Calculate</ThemedText>
                      </ThemedButton>
                    </View>
                  </View>
                </>
              )}
              <Modal
                visible={modalVisible}
                animationType={"fade"}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
              >
                <TouchableWithoutFeedback
                  onPress={() => {
                    setModalVisible(false);
                  }}
                >
                  <View style={styles.modalBackdrop}>
                    <View style={styles.modalContainer}>
                      <ThemedText style={styles.qnTxt}>
                        Work Activity
                      </ThemedText>
                      <DropDownPicker
                        zIndex={2}
                        items={workActivity}
                        value={workVal}
                        setValue={(callback) => {
                          setWorkVal(callback);
                          setErrWork(false);
                        }}
                        open={open1}
                        setOpen={setOpen1}
                      />
                      <ThemedText>
                        {workActivityDescriptions[workVal]}
                      </ThemedText>
                      {errWork && (
                        <ThemedText style={styles.errorTxt}>
                          Please select an activity level
                        </ThemedText>
                      )}
                      <ThemedText style={styles.qnTxt}>
                        Leisure Activity
                      </ThemedText>
                      <DropDownPicker
                        zIndex={1}
                        items={leisureActivity}
                        value={leisureVal}
                        setValue={(callback) => {
                          setLeisureVal(callback);
                          setErrLeisure(false);
                        }}
                        open={open2}
                        setOpen={setOpen2}
                      />
                      <ThemedText>
                        {leisureActivityDescription[leisureVal]}
                      </ThemedText>
                      {errLeisure && (
                        <ThemedText style={styles.errorTxt}>
                          Please select an activity level
                        </ThemedText>
                      )}
                      <ThemedButton
                        style={styles.addButton}
                        onPress={() => {
                          setModalVisible(false);
                          if (workVal === 0) {
                            setErrWork(true);
                          }
                          if (leisureVal === 0) {
                            setErrLeisure(true);
                          }
                          if (workVal !== 0 && leisureVal !== 0) {
                            setPALTemp(
                              calculateActivityLevel(workVal, leisureVal),
                            );
                            setModalVisible(false);
                          }
                        }}
                      >
                        <ThemedText>Calculate</ThemedText>
                      </ThemedButton>
                      <ThemedButton
                        style={styles.addButton}
                        onPress={() => {
                          setModalVisible(false);
                        }}
                      >
                        <ThemedText>Cancel</ThemedText>
                      </ThemedButton>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
              <ThemedButton
                onPress={() => {
                  setErrWeight(false);
                  setErrHeight(false);
                  setErrAge(false);
                  setErrFat(false);
                  const tempWeight = parseInt(weight);
                  const tempHeight = parseInt(height);
                  const tempAge = parseInt(age);
                  const tempFat = parseFloat(fat);

                  let hasError = false;

                  if (isNaN(tempWeight)) {
                    setErrWeight(true);
                    hasError = true;
                  }

                  if (isNaN(tempHeight)) {
                    setErrHeight(true);
                    hasError = true;
                  }

                  if (isNaN(tempAge)) {
                    setErrAge(true);
                    hasError = true;
                  }
                  if (mode === "katch" && isNaN(tempFat)) {
                    setErrFat(true);
                    hasError = true;
                  }
                  if (hasError) {
                    setShowResults(false);
                    return;
                  }
                  if (mode === "mifflin") {
                    setBmr(
                      mifflinBMRCalc(sex, tempWeight, tempHeight, tempAge),
                    );
                  } else {
                    setBmr(katchBMRCalc(sex, tempWeight, tempHeight, tempFat));
                  }
                  if (toggletdee) {
                    setTdee(Math.round(bmr * physicalActivityLevel));
                    setToggletdeeres(true);
                  } else {
                    setToggletdeeres(false);
                  }
                  setShowResults(true);
                }}
              >
                <ThemedText>Calculate</ThemedText>
              </ThemedButton>
              {showResults && (
                <>
                  <View style={{ flexDirection: "row" }}>
                    <View style={styles.resultsBox}>
                      <ThemedText style={styles.resultsTxt}>BMR: {bmr}</ThemedText>
                    </View>
                    {toggletdeeres && (
                      <View style={styles.resultsBox}>
                        <ThemedText style={styles.resultsTxt}>TDEE: {tdee}</ThemedText>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
};
export default calories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
  },
  qnBox: {
    marginTop: 15,
    alignItems: "center",
    gap: 10,
    maxWidth: "70%",
    flexDirection: "row",
  },
  qnTxt: {
    padding: 10,
    width: 120,
    textAlign: "right",
  },
  textInput: {
    flex: 1,
  },
  errorTxt: {
    color: "dark-red",
  },
  options: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-start",
    borderRadius: 1,
  },
  addButton: {
    backgroundColor: "#2196f3",
    borderRadius: 1,
    padding: 10,
    width: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: {
    backgroundColor: "#7d015c",
  },
  buttonicons: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  faqBox: {
    backgroundColor: "rgba(211,211,211,0.2)",
    borderRadius: 20,
    marginTop: 10,
    flex: 1,
  },
  faqTxt: {
    alignItems: "center",
    margin: 20,
  },
  resultsBox: {
    flex:1,
    alignItems: "center",
    justifyContent:"center",
    height: 50,
  },
    resultsTxt: {
      textAlign:"center",
    }
});
