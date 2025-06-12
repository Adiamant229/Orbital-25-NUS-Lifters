//react imports
import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

//firebase imports
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import ThemedTextInput from "../../components/themedTextInput";
import Spacer from "../../components/spacer";

const UtownReports = () => {
  const [reports, setReports] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(null);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [equipmentItems, setEquipmentItems] = useState([
    { label: "Bench Press", value: "Bench Press" },
    { label: "Incline Bench Press", value: "Incline Bench Press" },
    { label: "Squat Rack 1", value: "Squat Rack 1" },
    { label: "Squat Rack 2", value: "Squat Rack 2" },
    { label: "Smith Machine 1", value: "Smith Machine 1" },
    { label: "Smith Machine 2", value: "Smith Machine 2" },
    { label: "Treadmill 1", value: "Treadmill 1" },
    { label: "Treadmill 2", value: "Treadmill 2" },
    { label: "Treadmill 3", value: "Treadmill 3" },
    { label: "Treadmill 4", value: "Treadmill 4" },
    { label: "Treadmill 5", value: "Treadmill 5" },
    { label: "Treadmill 6", value: "Treadmill 6" },
    { label: "Leg Press Machine", value: "Leg Press Machine" },
    { label: "Leg Extensions Machine", value: "Leg Extensions Machine" },
  ]);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueValue, setIssueValue] = useState(null);
  const [issueItems, setIssueItems] = useState([
    { label: "Damaged", value: "Damaged" },
    { label: "Missing", value: "Missing" },
    {
      label: "Under Maintenance",
      value: "Under Maintenance",
    },
    { label: "Cleanliness Issue", value: "Cleanliness Issue" },
  ]);

  // Reference to the Firestore collection
  const reportsRef = collection(db, "utownReports");

  // Fetch reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const snapshot = await getDocs(reportsRef);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  const handleAddReport = async () => {
    if (value && issueValue) {
      const newReport = {
        equipment: value,
        issueType: issueValue,
        remarks: remarks.trim(),
      };

      try {
        const docRef = await addDoc(reportsRef, newReport);
        setReports([...reports, { id: docRef.id, ...newReport }]);

        // Reset inputs
        setValue(null);
        setIssueValue(null);
        setRemarks("");
        setModalVisible(false);
      } catch (error) {
        console.error("Error adding report:", error);
      }
    } else {
      alert("Please select equipment and issue type.");
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await deleteDoc(doc(db, "utownReports", id));
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReportId === id) setSelectedReportId(null);
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>UTown Reports</ThemedText>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <ThemedText style={styles.addButtonText}>+</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedReportId === item.id;
          return (
            <TouchableOpacity
              onPress={() =>
                setSelectedReportId((prev) =>
                  prev === item.id ? null : item.id
                )
              }
              style={styles.card}
            >
              <Text style={styles.cardTitle}>
                {item.equipment} - {item.issueType}
              </Text>
              {isSelected && (
                <>
                  {item.remarks ? (
                    <Text style={styles.cardRemarks}>
                      Remarks: {item.remarks}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => handleDeleteReport(item.id)}
                    style={styles.resolveButton}
                  >
                    <Text style={styles.resolveButtonText}>Resolved</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Gym Report</Text>

              <View style={{ zIndex: 3000, marginBottom: open ? 150 : 20 }}>
                <Text style={{ marginBottom: 5 }}>Select Equipment:</Text>
                <DropDownPicker
                  open={open}
                  value={value}
                  items={equipmentItems}
                  setOpen={setOpen}
                  setValue={setValue}
                  setItems={setEquipmentItems}
                  placeholder="Select equipment"
                  maxHeight={150}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
              </View>

              <View
                style={{ zIndex: 2000, marginBottom: issueOpen ? 150 : 20 }}
              >
                <Text style={{ marginBottom: 5 }}>Select Issue Type:</Text>
                <DropDownPicker
                  open={issueOpen}
                  value={issueValue}
                  items={issueItems}
                  setOpen={setIssueOpen}
                  setValue={setIssueValue}
                  setItems={setIssueItems}
                  placeholder="Select issue type"
                  maxHeight={150}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
              </View>

              <Text style={{ marginBottom: 5 }}>Remarks (optional):</Text>
              <ThemedTextInput
                placeholder="Enter remarks"
                placeholderTextColor={"grey"}
                value={remarks}
                onChangeText={setRemarks}
              />

              <View style={styles.buttonRow}>
                <ThemedButton onPress={handleAddReport}>
                  <ThemedText>Submit</ThemedText>
                </ThemedButton>
                <Spacer width="25" />
                <ThemedButton onPress={() => setModalVisible(false)}>
                  <ThemedText>Cancel</ThemedText>
                </ThemedButton>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
};

export default UtownReports;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  addButton: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    zIndex: 1000,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  dropdown: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  dropdownContainer: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardRemarks: { marginTop: 8, color: "#555" },
  resolveButton: {
    marginTop: 10,
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  resolveButtonText: { color: "#fff", fontWeight: "bold" },
});
