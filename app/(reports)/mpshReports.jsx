//react and expo imports
import { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import uuid from "react-native-uuid";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";

//firebase imports
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { db, storage } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";


//themed components
import ThemedText from "../../components/themedText";
import ThemedView from "../../components/themedView";
import ThemedButton from "../../components/themedButton";
import ThemedTextInput from "../../components/themedTextInput";
import Spacer from "../../components/spacer";


const MpshReports = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;

  const [reports, setReports] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [remarks, setRemarks] = useState("");

  const [value, setValue] = useState(null);
  const [open, setOpen] = useState(false);

  const [expandedReportId, setExpandedReportId] = useState(null);

  const [imageDeletedLocally, setImageDeletedLocally] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueValue, setIssueValue] = useState(null);

  const [editingReportId, setEditingReportId] = useState(null);

  const reportsRef = collection(db, "mpshReports");

  const [originalReport, setOriginalReport] = useState(null);
  
  //equipment dropdown box
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

  //issue dropdown box
  const [issueItems, setIssueItems] = useState([
    { label: "Damaged", value: "Damaged" },
    { label: "Missing", value: "Missing" },
    { label: "Under Maintenance", value: "Under Maintenance" },
    { label: "Cleanliness Issue", value: "Cleanliness Issue" },
  ]);

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

  useEffect(() => {
    const loadReports = async () => {
      await fetchReports();
    };
    loadReports();
  }, []);

  const openAddModal = () => {
    setEditingReportId(null);
    setOriginalReport(null);
    setValue(null);
    setIssueValue(null);
    setRemarks("");
    setImageUri(null);
    setModalVisible(true);
  };
  

  const openEditModal = (report) => {
    setEditingReportId(report.id);
    setOriginalReport({
      equipment: report.equipment,
      issueType: report.issueType,
      remarks: report.remarks || "",
      imageUri: report.imageUrl || null,
    });
    setValue(report.equipment);
    setIssueValue(report.issueType);
    setRemarks(report.remarks || "");
    setImageUri(report.imageUrl || null);
    setModalVisible(true);
  };
  

  const handleSubmit = async () => {
    if (!value || !issueValue) {
      Alert.alert(
        "Submission Error",
        "Please select equipment and issue type."
      );

      return;
    }

    Alert.alert(
      editingReportId ? "Update Report" : "Submit Report",

      editingReportId
        ? "Are you sure you want to update this report?"
        : "Are you sure you want to submit this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: editingReportId ? "Update" : "Submit",
          style: "cancel",
          onPress: async () => {
            try {
              let imageUrl = null;
              let oldImageUrl = null;

              if (editingReportId) {
                const docRef = doc(db, "mpshReports", editingReportId);
                const reportSnapshot = await getDocs(reportsRef);
                const report = reportSnapshot.docs
                  .find((doc) => doc.id === editingReportId)
                  ?.data();
                oldImageUrl = report?.imageUrl || null;
              }

              if (imageUri && !imageUri.startsWith("https://")) {
                const response = await fetch(imageUri);
                const blob = await response.blob();

                const imageRef = ref(storage, `mpshReports/${uuid.v4()}`);
                await uploadBytes(imageRef, blob);
                imageUrl = await getDownloadURL(imageRef);

                if (oldImageUrl) {
                  try {
                    const oldPath = getStoragePathFromUrl(oldImageUrl);
                    await deleteObject(ref(storage, oldPath));
                    console.log("Old image deleted:", oldPath);
                  } catch (e) {
                    console.warn("Failed to delete old image:", e);
                  }
                }
              } else if (imageDeletedLocally && !imageUri) {
                if (oldImageUrl) {
                  try {
                    const oldPath = getStoragePathFromUrl(oldImageUrl);
                    await deleteObject(ref(storage, oldPath));
                    console.log("Deleted old image due to removal");
                  } catch (e) {
                    console.warn("Failed to delete old image:", e);
                  }
                }
                imageUrl = null;
              } else if (imageUri?.startsWith("https://")) {
                imageUrl = imageUri;
              }

              if (editingReportId) {
                const docRef = doc(db, "mpshReports", editingReportId);
                await updateDoc(docRef, {
                  equipment: value,
                  issueType: issueValue,
                  remarks: remarks.trim(),
                  ...(imageUrl !== null
                    ? { imageUrl }
                    : { imageUrl: deleteField() }),
                });

                setReports((prev) =>
                  prev.map((r) =>
                    r.id === editingReportId
                      ? {
                          ...r,
                          equipment: value,
                          issueType: issueValue,
                          remarks: remarks.trim(),
                          ...(imageUrl !== null
                            ? { imageUrl }
                            : { imageUrl: null }),
                        }
                      : r
                  )
                );
              } else {
                const newReport = {
                  equipment: value,
                  issueType: issueValue,
                  remarks: remarks.trim(),
                  userId: currentUserId,
                  ...(imageUrl && { imageUrl }),
                };

                const docRef = await addDoc(reportsRef, newReport);
                setReports([...reports, { id: docRef.id, ...newReport }]);
              }

              setModalVisible(false);
              setEditingReportId(null);
              setValue(null);
              setIssueValue(null);
              setRemarks("");
              setImageUri(null);
              setImageDeletedLocally(false);
            } catch (error) {
              console.error("Error submitting report:", error);
              Alert.alert("Failed to submit report.");
            }
          },
        },
      ]
    );
  };
  

  const getStoragePathFromUrl = (url) => {
    try {
      const decodePath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      return decodePath;
    } catch (err) {
      console.error("Error parsing storage path:", err);
      return null;
    }
  };

  const handleDeleteReport = (id) => {
    Alert.alert(
      "Resolve Report",
      "Are you sure you want to mark this report as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          style: "destructive",
          onPress: async () => {
            try {
              const reportToDelete = reports.find((r) => r.id === id);

              if (reportToDelete?.imageUrl) {
                const imagePath = getStoragePathFromUrl(
                  reportToDelete.imageUrl
                );
                const imageRef = ref(storage, imagePath);
                await deleteObject(imageRef);
              }

              await deleteDoc(doc(db, "mpshReports", id));

              setReports((prev) => prev.filter((r) => r.id !== id));
              if (editingReportId === id) setEditingReportId(null);
            } catch (error) {
              console.error("Error deleting report:", error);
              Alert.alert("Error", "Could not delete the report.");
            }
          },
        },
      ]
    );
  };
  

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageDeletedLocally(true);
  };


  const changesDone = () => {
    if (!originalReport) {
      // Adding new report: check if anything is filled
      return (
        value !== null ||
        issueValue !== null ||
        remarks.trim() !== "" ||
        imageUri !== null
      );
    } else {
      // Editing: check if any field differs from original
      return (
        value !== originalReport.equipment ||
        issueValue !== originalReport.issueType ||
        remarks.trim() !== originalReport.remarks.trim() ||
        imageUri !== originalReport.imageUri
      );
    }
  };
  
  const handleCancelPress = () => {
    if (changesDone()) {
      Alert.alert(
        editingReportId ? "Discard Changes?" : "Cancel New Report?",
        editingReportId
          ? "You have unsaved changes. Are you sure you want to discard them?"
          : "You have started creating a new report. Are you sure you want to cancel?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: () => {
              setModalVisible(false);
              setEditingReportId(null);
              setOriginalReport(null);
              setValue(null);
              setIssueValue(null);
              setRemarks("");
              setImageUri(null);
              setImageDeletedLocally(false);
            },
          },
        ]
      );
    } else {
      setModalVisible(false);
      setEditingReportId(null);
      setOriginalReport(null);
      setValue(null);
      setIssueValue(null);
      setRemarks("");
      setImageUri(null);
      setImageDeletedLocally(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>MPSH Reports</ThemedText>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <ThemedText>+</ThemedText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 50, color: "#888" }}>
            No reports yet. Tap + to add one.
          </Text>
        }
        renderItem={({ item }) => {
          const isCurrentUser = item.userId === currentUserId;
          const isExpanded = expandedReportId === item.id;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpandedReportId(isExpanded ? null : item.id)}
            >
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {item.equipment} - {item.issueType}
                  </Text>
                  {isExpanded && isCurrentUser && (
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      testID={`edit-icon-${item.id}`}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color="#007AFF"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {isExpanded && (
                  <>
                    {item.remarks ? (
                      <Text style={styles.cardRemarks}>
                        Remarks: {item.remarks}
                      </Text>
                    ) : null}

                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.reportImage}
                        resizeMode="cover"
                        testID={`report-image-${item.id}`}
                      />
                    )}

                    <TouchableOpacity
                      onPress={() => handleDeleteReport(item.id)}
                      style={styles.resolveButton}
                    >
                      <View style={styles.buttonicons}>
                        <Entypo name="tools" size={20} color="white" />
                        <ThemedText>Resolved</ThemedText>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingReportId(null);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingReportId ? "Edit Gym Report" : "Add Gym Report"}
              </Text>

              <View style={{ marginBottom: open ? 150 : 20 }}>
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

              <View style={{ marginBottom: issueOpen ? 150 : 20 }}>
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

              <View style={{ marginBottom: 20 }}>
                <Text style={{ marginBottom: 5 }}>
                  Attach Photo (optional):
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <ThemedButton onPress={pickImage}>
                    <ThemedText>Pick from Gallery</ThemedText>
                  </ThemedButton>

                  <ThemedButton onPress={takePhoto}>
                    <ThemedText>Take Photo</ThemedText>
                  </ThemedButton>
                </View>

                {imageUri && (
                  <>
                    <Image
                      source={{ uri: imageUri }}
                      style={{
                        width: "100%",
                        height: 150,
                        marginTop: 10,
                        marginBottom: 10,
                        borderRadius: 8,
                      }}
                    />
                    <TouchableOpacity onPress={handleRemoveImage}>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ff3b30"
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.modalbuttonRow}>
                <ThemedButton onPress={handleSubmit}>
                  <ThemedText>{editingReportId ? "Save" : "Submit"}</ThemedText>
                </ThemedButton>
                <Spacer width="25" />
                <ThemedButton onPress={handleCancelPress}>
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

export default MpshReports;

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
  modalbuttonRow: {
    flexDirection: "row",
    justifyContent: "center",
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flexShrink: 1,
    marginRight: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "nowrap",
  },
  cardRemarks: { marginTop: 8, color: "#555" },
  resolveButton: {
    marginTop: 10,
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  buttonicons: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  reportImage: {
    width: "100%",
    height: 150,
    marginTop: 10,
    borderRadius: 8,
  },
});
