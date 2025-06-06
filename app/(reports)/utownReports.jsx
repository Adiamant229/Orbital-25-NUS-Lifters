import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";

const GymReportPage = () => {
  const [reports, setReports] = useState([
    { id: "1", type: "Broken Treadmill" },
    { id: "2", type: "Missing Dumbbell" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);

  // Dropdown states
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "Broken Equipment", value: "Broken Equipment" },
    { label: "Missing Equipment", value: "Missing Equipment" },
    { label: "Cleanliness Issue", value: "Cleanliness Issue" },
  ]);

  const handleAddReport = () => {
    if (value) {
      const newReport = {
        id: (reports.length + 1).toString(),
        type: value,
      };
      setReports([...reports, newReport]);
      setValue(null);
      setModalVisible(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>UTown Reports</ThemedText>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <ThemedText style={styles.addButtonText}>+</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Report List */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportItem}>
            <ThemedText>{item.type}</ThemedText>
          </View>
        )}
      />

      {/* Add Report Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Gym Report</Text>

            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder="Select issue type"
              style={{ marginBottom: open ? 120 : 20 }}
            />

            <TouchableOpacity
              onPress={handleAddReport}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

export default GymReportPage; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  reportItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginHorizontal: 20,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#888",
  },
});
