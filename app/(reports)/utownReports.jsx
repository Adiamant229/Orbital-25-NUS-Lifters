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
  Platform, // Import Platform for KeyboardAvoidingView
  KeyboardAvoidingView, // Import KeyboardAvoidingView
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
  getDocs, // Still needed for specific cases like getting old image URL when updating
  getDoc, // Added for fetching a single document
  deleteDoc,
  doc,
  updateDoc,
  deleteField,
  onSnapshot, // Crucial for real-time updates
  query, // For creating queries for onSnapshot
} from "firebase/firestore";
import { db, storage } from "../../firebaseConfig"; // Assuming db and storage are correctly exported
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

const UtownReports = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;

  const [reports, setReports] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [remarks, setRemarks] = useState("");

  const [value, setValue] = useState(null); // Selected equipment
  const [open, setOpen] = useState(false); // Dropdown state for equipment

  const [expandedReportId, setExpandedReportId] = useState(null);

  const [imageDeletedLocally, setImageDeletedLocally] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const [issueOpen, setIssueOpen] = useState(false); // Dropdown state for issue type
  const [issueValue, setIssueValue] = useState(null); // Selected issue type

  const [editingReportId, setEditingReportId] = useState(null);

  // Firestore collection reference
  const reportsCollectionRef = collection(db, "utownReports");

  // State to store the original report data when editing for comparison
  const [originalReport, setOriginalReport] = useState(null);

  // Equipment dropdown items
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

  // Issue dropdown items
  const [issueItems, setIssueItems] = useState([
    { label: "Damaged", value: "Damaged" },
    { label: "Missing", value: "Missing" },
    { label: "Under Maintenance", value: "Under Maintenance" },
    { label: "Cleanliness Issue", value: "Cleanliness Issue" },
  ]);

  // useEffect for real-time reports fetching using onSnapshot
  useEffect(() => {
    // Create a query to listen to the 'utownReports' collection
    const q = query(reportsCollectionRef);

    // Set up the real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort reports, for example, by a 'createdAt' field if available, or just alphabetically by equipment
        // Assuming reports might have a 'createdAt' field for better sorting
        data.sort((a, b) => {
          // If createdAt exists and is a Firebase Timestamp, convert to milliseconds for comparison
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA; // Sort by newest first
        });
        setReports(data);
      },
      (error) => {
        console.error("Error fetching real-time reports:", error);
      }
    );

    // Return the unsubscribe function to clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on component mount

  // Function to open the add new report modal
  const openAddModal = () => {
    setEditingReportId(null);
    setOriginalReport(null);
    setValue(null);
    setIssueValue(null);
    setRemarks("");
    setImageUri(null);
    setImageDeletedLocally(false); // Reset this flag for new reports
    setModalVisible(true);
  };

  // Function to open the edit report modal and pre-fill data
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
    setImageDeletedLocally(false); // Reset this flag when opening for edit
    setModalVisible(true);
  };

  // Function to handle form submission (add or update)
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
          style: "default", // Changed style to default to make it clickable by spyOn in tests
          onPress: async () => {
            try {
              let newImageUrl = null; // This will hold the URL for the new/updated image
              let oldImageUrlFromDb = null; // This will hold the existing image URL from the DB

              // If editing, get the current image URL from the document in DB
              if (editingReportId) {
                const docRef = doc(db, "utownReports", editingReportId);
                const reportSnap = await getDoc(docRef); // Use getDoc for single document
                if (reportSnap.exists()) {
                  oldImageUrlFromDb = reportSnap.data().imageUrl || null;
                }
              }

              // Handle image upload/deletion logic
              if (imageUri && !imageUri.startsWith("https://")) {
                // New image selected (local URI)
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const imageRef = ref(storage, `utownReports/${uuid.v4()}`);
                await uploadBytes(imageRef, blob);
                newImageUrl = await getDownloadURL(imageRef);

                // If there was an old image, delete it from storage
                if (oldImageUrlFromDb) {
                  try {
                    const oldPath = getStoragePathFromUrl(oldImageUrlFromDb);
                    await deleteObject(ref(storage, oldPath));
                    console.log("Old image deleted:", oldPath);
                  } catch (e) {
                    console.warn("Failed to delete old image:", e);
                  }
                }
              } else if (imageDeletedLocally && oldImageUrlFromDb) {
                // User explicitly removed the image, and there was one previously
                try {
                  const oldPath = getStoragePathFromUrl(oldImageUrlFromDb);
                  await deleteObject(ref(storage, oldPath));
                  console.log("Deleted old image due to removal");
                } catch (e) {
                  console.warn("Failed to delete old image locally:", e);
                }
                newImageUrl = deleteField(); // Use deleteField to remove the field from Firestore
              } else if (imageUri?.startsWith("https://")) {
                // Existing image is still present (not changed or removed)
                newImageUrl = imageUri;
              } else {
                // No image (either never had one, or a new report with no image selected)
                newImageUrl = null; // Ensure it's explicitly null if no image should be set
              }

              const reportData = {
                equipment: value,
                issueType: issueValue,
                remarks: remarks.trim(),
                userId: currentUserId, // Only set for new reports or if it's explicitly allowed to change
              };

              // Conditionally add imageUrl to reportData
              if (newImageUrl === deleteField()) {
                reportData.imageUrl = deleteField(); // Use Firestore's deleteField
              } else if (newImageUrl) {
                reportData.imageUrl = newImageUrl;
              } else {
                // If imageUrl is null (no new image, no old image, or deleted), ensure it's not present or explicitly null
                // For updates, deleteField is preferred if removing an existing image.
                // For new reports, just don't add the field if no image.
                if (editingReportId && oldImageUrlFromDb && !imageUri) {
                  reportData.imageUrl = deleteField();
                } else if (!newImageUrl && !editingReportId) {
                  // Do nothing, don't add imageUrl field for new report if no image
                } else if (
                  !newImageUrl &&
                  editingReportId &&
                  !oldImageUrlFromDb
                ) {
                  // Do nothing, if editing and no new image, and no old image, no change needed.
                }
              }

              if (editingReportId) {
                const docRef = doc(db, "utownReports", editingReportId);
                await updateDoc(docRef, reportData); // Use reportData directly
              } else {
                // Add createdAt only for new reports
                reportData.createdAt = new Date();
                await addDoc(reportsCollectionRef, reportData);
              }

              // Reset modal states
              setModalVisible(false);
              setEditingReportId(null);
              setOriginalReport(null);
              setValue(null);
              setIssueValue(null);
              setRemarks("");
              setImageUri(null);
              setImageDeletedLocally(false);
              Alert.alert(
                "Success",
                editingReportId ? "Report updated!" : "Report submitted!"
              );
              // onSnapshot listener will automatically update the UI, no manual setReports needed
            } catch (error) {
              console.error("Error submitting report:", error);
              Alert.alert("Failed to submit report.");
            }
          },
        },
      ]
    );
  };

  // Helper to extract storage path from a Firebase Storage URL
  const getStoragePathFromUrl = (url) => {
    try {
      const decodedPath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      return decodedPath;
    } catch (err) {
      console.error("Error parsing storage path:", err);
      return null;
    }
  };

  // Function to handle deleting/resolving a report
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
              const reportDocRef = doc(db, "utownReports", id);
              const reportSnap = await getDoc(reportDocRef);
              const reportToDelete = reportSnap.data();

              if (reportToDelete?.imageUrl) {
                const imagePath = getStoragePathFromUrl(
                  reportToDelete.imageUrl
                );
                const imageRef = ref(storage, imagePath);
                await deleteObject(imageRef);
                console.log("Image deleted from storage:", imagePath);
              }

              await deleteDoc(reportDocRef);
              // onSnapshot listener will automatically update the reports state, no manual filter needed
              Alert.alert("Success", "Report marked as resolved!");
              // If the deleted report was currently expanded, close the expansion
              if (expandedReportId === id) {
                setExpandedReportId(null);
              }
            } catch (error) {
              console.error("Error deleting report:", error);
              Alert.alert("Error", "Could not delete the report.");
            }
          },
        },
      ]
    );
  };

  // Function to pick an image from the device's gallery
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected mediaTypes enum
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageDeletedLocally(false); // Reset flag if a new image is picked
    }
  };

  // Function to take a photo using the device's camera
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
      setImageDeletedLocally(false); // Reset flag if a new image is taken
    }
  };

  // Function to remove a locally selected or previously loaded image
  const handleRemoveImage = () => {
    setImageUri(null);
    setImageDeletedLocally(true); // Mark that image was removed locally
  };

  // Function to check if any changes have been made in the form
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
        imageUri !== originalReport.imageUri ||
        (imageDeletedLocally && originalReport.imageUri !== null) // Check if an existing image was explicitly removed
      );
    }
  };

  // Function to handle modal cancellation with confirmation
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
          <ThemedText
            style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
          >
            +
          </ThemedText>
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
                        <ThemedText style={{ color: "white" }}>
                          Resolved
                        </ThemedText>
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
        onRequestClose={handleCancelPress} // Use handleCancelPress here
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView // Use KeyboardAvoidingView here
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingReportId ? "Edit Gym Report" : "Add Gym Report"}
              </Text>

              <View style={{ marginBottom: open ? 150 : 20, zIndex: 2000 }}>
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
                  listMode="SCROLLVIEW" // Add listMode for better behavior with KeyboardAvoidingView
                />
              </View>

              <View
                style={{ marginBottom: issueOpen ? 150 : 20, zIndex: 1000 }}
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
                  listMode="SCROLLVIEW" // Add listMode for better behavior with KeyboardAvoidingView
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
                    <ThemedText style={{ color: "white" }}>
                      Pick from Gallery
                    </ThemedText>
                  </ThemedButton>

                  <ThemedButton onPress={takePhoto}>
                    <ThemedText style={{ color: "white" }}>
                      Take Photo
                    </ThemedText>
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
                      testID="image-preview"
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
                  <ThemedText style={{ color: "white" }}>
                    {editingReportId ? "Save" : "Submit"}
                  </ThemedText>
                </ThemedButton>
                <Spacer width="25" />
                <ThemedButton onPress={handleCancelPress}>
                  <ThemedText style={{ color: "white" }}>Cancel</ThemedText>
                </ThemedButton>
              </View>
            </View>
          </KeyboardAvoidingView>
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
