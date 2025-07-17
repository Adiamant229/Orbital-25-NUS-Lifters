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
import ThemedTextInput from "../../components/themedTextInput";
import ThemedButton from "../../components/themedButton";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;

const calories = () => {
  const [mode, setMode] = useState("mifflin");
  const [sex, setSex] = useState(1);

  const [height, setHeight] = useState("");
  const [errHeight, setErrHeight] = useState(false);
  const setHeightTemp = (x) => {
    setHeight(x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"));
  };

  const [weight, setWeight] = useState("");
  const [errWeight, setErrWeight] = useState(false);
  const setWeightTemp = (x) => {
    setWeight(x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"));
  };
  const [age, setAge] = useState("");
  const [errAge, setErrAge] = useState(false);
  const setAgeTemp = (x) => {
    setAge(x.replace(/[^0-9]/g, ""));
  };
  const [fat, setFat] = useState("");
  const [errFat, setErrFat] = useState(false);
  const setFatTemp = (x) => {
    setFat(x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"));
  };
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [physicalActivityLevel, setPhysicalActivityLevel] = useState("1");
  const setPALTemp = (x) => {
    setPhysicalActivityLevel(
      x.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1")
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
        (sex % 2) * 5
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

  const router = useRouter();

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
              <ThemedText
                style={[styles.title, { marginBottom: 40 }]}
                title={true}
              >
                How many calories should I eat?
              </ThemedText>

              <ThemedText style={styles.title} title={true}>
                Calorie Calculator
              </ThemedText>

              <View style={{ height: 150 }}>
                <ScrollView style={styles.faqBox} nestedScrollEnabled={true}>
                  <ThemedText style={[styles.faqTxt, { marginBottom: 20 }]}>
                    {description}
                  </ThemedText>
                </ScrollView>
              </View>

              {/* Mode */}
              <View
                style={[
                  styles.qnBox,
                  {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    paddingHorizontal: 0,
                    width: "100%",
                  },
                ]}
              >
                {/* Left: Mode label + help icon tightly aligned */}
                <View style={styles.closeLabelRow}>
                  <ThemedText style={styles.closeLabelText}>Mode</ThemedText>
                  <Pressable
                    style={{ padding: 0, margin: 0 }}
                    onPress={() => setShowModeDescription(!showModeDescription)}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={16}
                      color={"grey"}
                      style={styles.closeHelpIcon}
                    />
                  </Pressable>
                </View>

                {/* Right: Buttons side by side */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setMode("mifflin")}
                    style={[
                      styles.addButton,
                      mode === "mifflin" && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText style={{ color: "white" }}>
                        Mifflin-St Jeor
                      </ThemedText>
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
                      <ThemedText style={{ color: "white" }}>
                        Katch-McArdle
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {showModeDescription && (
                <View style={{ height: 300 }}>
                  <View style={styles.faqBox}>
                    <ThemedText style={styles.faqTxt}>
                      {modeDescription}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Biological Sex */}
              <View style={styles.qnBox}>
                <View
                  style={{
                    width: 130,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={styles.qnTxt}>Biological Sex</ThemedText>
                </View>
                <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setSex(1)}
                    style={[
                      styles.addButton,
                      sex === 1 && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText style={{ color: "white" }}>Male</ThemedText>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSex(0)}
                    style={[
                      styles.addButton,
                      sex === 0 && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText style={{ color: "white" }}>Female</ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Age */}
              <View style={styles.qnBox}>
                <View
                  style={{
                    width: 140,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={styles.qnTxt}>Age (in years)</ThemedText>
                </View>
                <ThemedTextInput
                  keyboardType={"number-pad"}
                  onChangeText={setAgeTemp}
                  value={age}
                  style={styles.textInput}
                  placeholder="Enter age"
                  placeholderTextColor="grey"
                />
              </View>
              {errAge && (
                <ThemedText style={styles.errorTxt}>
                  Please input valid age
                </ThemedText>
              )}

              {/* Height */}
              <View style={styles.qnBox}>
                <View
                  style={{
                    width: 140,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={styles.qnTxt}>Height (in cm)</ThemedText>
                </View>
                <ThemedTextInput
                  keyboardType={"number-pad"}
                  onChangeText={setHeightTemp}
                  value={height}
                  style={styles.textInput}
                  placeholder="Enter height"
                  placeholderTextColor="grey"
                />
              </View>
              {errHeight && (
                <ThemedText style={styles.errorTxt}>
                  Please input valid height
                </ThemedText>
              )}

              {/* Weight */}
              <View style={styles.qnBox}>
                <View
                  style={{
                    width: 140,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={styles.qnTxt}>Weight (in kg)</ThemedText>
                </View>
                <ThemedTextInput
                  keyboardType={"decimal-pad"}
                  onChangeText={setWeightTemp}
                  value={weight}
                  style={styles.textInput}
                  placeholder="Enter weight"
                  placeholderTextColor="grey"
                />
              </View>
              {errWeight && (
                <ThemedText style={styles.errorTxt}>
                  Please input valid weight
                </ThemedText>
              )}

              {/* Fat % (only in Katch mode) */}
              {mode === "katch" && (
                <View style={styles.qnBox}>
                  <View
                    style={{
                      width: 140,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <ThemedText style={styles.qnTxt}>Fat (%)</ThemedText>
                  </View>
                  <ThemedTextInput
                    keyboardType={"decimal-pad"}
                    onChangeText={setFatTemp}
                    value={fat}
                    style={styles.textInput}
                    placeholder="Enter fat %"
                    placeholderTextColor="grey"
                  />
                  {errFat && (
                    <ThemedText style={styles.errorTxt}>
                      Please input valid fat percentage
                    </ThemedText>
                  )}
                </View>
              )}

              {/* Calculate TDEE */}
              <View style={styles.qnBox}>
                <View style={{ width: 135 }}>
                  <View style={styles.closeLabelRow}>
                    <ThemedText style={styles.closeLabelText}>
                      Calculate TDEE
                    </ThemedText>
                    <Pressable
                      style={{ padding: 0, margin: 0 }}
                      onPress={() =>
                        setShowTdeeDescription(!showTdeeDescription)
                      }
                    >
                      <Ionicons
                        name="help-circle-outline"
                        size={16}
                        color={"grey"}
                        style={styles.closeHelpIcon}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => settoggletdee(false)}
                    style={[
                      styles.addButton,
                      !toggletdee && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText style={{ color: "white" }}>No</ThemedText>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => settoggletdee(true)}
                    style={[
                      styles.addButton,
                      toggletdee && styles.selectedButton,
                    ]}
                  >
                    <View style={styles.buttonicons}>
                      <ThemedText style={{ color: "white" }}>Yes</ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {showTdeeDescription && (
                <View style={{ height: 150 }}>
                  <View style={styles.faqBox} nestedScrollEnabled={true}>
                    <ThemedText style={styles.faqTxt}>
                      {tdeeDescription}
                    </ThemedText>
                  </View>
                </View>
              )}

              {toggletdee === true && (
                <>
                  <View
                    style={[
                      styles.qnBox,
                      {
                        flexDirection: "column",
                        alignItems: "flex-start",
                        paddingVertical: 10,
                      },
                    ]}
                  >
                    {/* Row 1: Label + help icon */}
                    <View
                      style={[
                        styles.closeLabelRow,
                        {
                          width: "100%",
                          justifyContent: "flex-start",
                        },
                      ]}
                    >
                      <ThemedText style={styles.closeLabelText}>
                        Physical Activity Level
                      </ThemedText>
                      <Pressable
                        style={{ padding: 0, margin: 0 }}
                        onPress={() =>
                          setShowPalDescription(!showPalDescription)
                        }
                      >
                        <Ionicons
                          name="help-circle-outline"
                          size={16}
                          color={"grey"}
                          style={styles.closeHelpIcon}
                        />
                      </Pressable>
                    </View>

                    {/* Row 2: Your Level and Calculate button side by side */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        width: "100%",
                      }}
                    >
                      <ThemedText>
                        Activity Level: {physicalActivityLevel}
                      </ThemedText>

                      <ThemedButton
                        onPress={() => setModalVisible(true)}
                        style={[
                          styles.addButton,
                          { minWidth: 150, backgroundColor: "#2196f3" },
                        ]}
                      >
                        <ThemedText style={{ color: "white" }}>
                          Select Level
                        </ThemedText>
                      </ThemedButton>
                    </View>
                  </View>

                  {showPalDescription && (
                    <View style={{ height: 100 }}>
                      <ScrollView style={styles.faqBox}>
                        <ThemedText style={styles.faqTxt}>
                          {palDescription}
                        </ThemedText>
                      </ScrollView>
                    </View>
                  )}
                </>
              )}

              {/* Modal for Work and Leisure Activity */}
              <Modal
                visible={modalVisible}
                animationType={"fade"}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
              >
                <TouchableWithoutFeedback
                  onPress={() => setModalVisible(false)}
                >
                  <View style={styles.modalBackdrop}>
                    <ThemedView style={styles.modalContainer}>
                      <ThemedText style={[styles.qnTxt, { color: "black" }]}>
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

                      <ThemedText style={[styles.qnTxt, { color: "black" }]}>
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
                      
                      {/* Buttons side by side */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: 12, // space between buttons
                          marginTop: 20,
                        }}
                      >
                        <ThemedButton
                          style={[
                            styles.addButton,
                            {
                              flex: 1,
                              marginRight: 10,
                              backgroundColor: "#7d015c",
                            },
                          ]}
                          onPress={() => {
                            if (workVal === 0) setErrWork(true);
                            if (leisureVal === 0) setErrLeisure(true);
                            if (workVal !== 0 && leisureVal !== 0) {
                              setPALTemp(
                                calculateActivityLevel(workVal, leisureVal)
                              );
                              setModalVisible(false);
                            }
                          }}
                        >
                          <ThemedText
                            style={{ textAlign: "center", color: "white" }}
                          >
                            Calculate
                          </ThemedText>
                        </ThemedButton>

                        <ThemedButton
                          style={[
                            styles.addButton,
                            { flex: 1, marginLeft: 10 },
                          ]}
                          onPress={() => setModalVisible(false)}
                        >
                          <ThemedText
                            style={{ textAlign: "center", color: "white" }}
                          >
                            Cancel
                          </ThemedText>
                        </ThemedButton>
                      </View>
                    </ThemedView>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>

              {/* Centered Row: Calculate + Cancel Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 20,
                }}
              >
                <ThemedButton
                  style={[
                    styles.addButton,
                    { width: 50, height: 50, backgroundColor: "#7d015c" },
                  ]}
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

                  if (isNaN(tempWeight) || tempWeight <= 0 || tempWeight > 250) {
                    setErrWeight(true);
                    hasError = true;
                  }

                  if (isNaN(tempHeight) || tempHeight <= 10 || tempHeight > 300) {
                    setErrHeight(true);
                    hasError = true;
                  }

                  if (isNaN(tempAge) || tempAge <= 0 || tempAge > 150) {
                    setErrAge(true);
                    hasError = true;
                  }
                  if (mode === "katch" && (isNaN(tempFat) || tempFat <= 0 || tempFat > 100)) {
                    setErrFat(true);
                    hasError = true;
                  }
                  if (hasError) {
                    setShowResults(false);
                    return;
                  }
                  if (mode === "mifflin") {
                    setBmr(
                      mifflinBMRCalc(sex, tempWeight, tempHeight, tempAge)
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
                  <ThemedText style={{ color: "white" }}>Calculate</ThemedText>
                </ThemedButton>

                <ThemedButton
                  onPress={() => router.back()}
                  style={[
                    styles.addButton,
                    { width: 50, height: 50, backgroundColor: "grey" },
                  ]}
                >
                  <ThemedText style={{ color: "white" }}>Cancel</ThemedText>
                </ThemedButton>
              </View>

              {/* Results */}
              {showResults && (
                <>
                  <View style={{ flexDirection: "row" }}>
                    <View style={styles.resultsBox}>
                      <ThemedText style={styles.resultsTxt}>
                        Your BMR: {bmr}
                      </ThemedText>
                    </View>
                    {toggletdeeres && (
                      <View style={styles.resultsBox}>
                        <ThemedText style={styles.resultsTxt}>
                          Your TDEE: {tdee}
                        </ThemedText>
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
    fontSize: 20,
    alignSelf: "center",
    textAlign: "center",
  },
  qnBox: {
    marginTop: 15,
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
  },
  qnTxt: {
    width: 140,
    fontSize: 16,
  },
  textInput: {
    width: 97,
    fontSize: 12,
    lineHeight: 16,
    height: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorTxt: {
    color: "#B71C1C",
    marginTop: 5,
    marginLeft: 5,
  },
  options: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  addButton: {
    backgroundColor: "#2196f3",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    marginVertical: 5,
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
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
    backgroundColor: "white",
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
    padding: 15,
    marginTop: 10,
  },
  faqTxt: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultsBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    marginVertical: 10,
  },
  resultsTxt: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  closeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  closeLabelText: {
    fontSize: 16,
    marginRight: 2,
    width: "auto", // override the fixed width
  },

  closeHelpIcon: {
    marginLeft: -2, // negative margin to pull icon close
    marginTop: -8,
  },
});
