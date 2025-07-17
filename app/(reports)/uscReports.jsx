//react and expo imports
import { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  Linking,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import uuid from "react-native-uuid";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";

//firebase imports
import {
  collection,
  addDoc,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  deleteField,
  onSnapshot,
  query,
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

const UscReports = () => {
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

  const reportsCollectionRef = collection(db, "uscReports");

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

  useEffect(() => {
    const q = query(reportsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        setReports(data);
      },
      (error) => {
        console.error("Error fetching real-time reports:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingReportId(null);
    setOriginalReport(null);
    setValue(null);
    setIssueValue(null);
    setRemarks("");
    setImageUri(null);
    setImageDeletedLocally(false);
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
    setImageDeletedLocally(false);
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
          style: "default",
          onPress: async () => {
            try {
              let newImageUrl = null;
              let oldImageUrlFromDb = null;

              if (editingReportId) {
                const docRef = doc(db, "uscReports", editingReportId);
                const reportSnap = await getDoc(docRef);
                if (reportSnap.exists()) {
                  oldImageUrlFromDb = reportSnap.data().imageUrl || null;
                }
              }

              if (imageUri && !imageUri.startsWith("https://")) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const imageRef = ref(storage, `uscReports/${uuid.v4()}`);
                await uploadBytes(imageRef, blob);
                newImageUrl = await getDownloadURL(imageRef);

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
                try {
                  const oldPath = getStoragePathFromUrl(oldImageUrlFromDb);
                  await deleteObject(ref(storage, oldPath));
                  console.log("Deleted old image due to removal");
                } catch (e) {
                  console.warn("Failed to delete old image locally:", e);
                }
                newImageUrl = deleteField();
              } else if (imageUri?.startsWith("https://")) {
                newImageUrl = imageUri;
              } else {
                newImageUrl = null;
              }

              const reportData = {
                equipment: value,
                issueType: issueValue,
                remarks: remarks.trim(),
                userId: currentUserId,
              };

              if (newImageUrl === deleteField()) {
                reportData.imageUrl = deleteField();
              } else if (newImageUrl) {
                reportData.imageUrl = newImageUrl;
              } else {
                if (editingReportId && oldImageUrlFromDb && !imageUri) {
                  reportData.imageUrl = deleteField();
                } else if (!newImageUrl && !editingReportId) {
                } else if (
                  !newImageUrl &&
                  editingReportId &&
                  !oldImageUrlFromDb
                ) {
                }
              }

              if (editingReportId) {
                const docRef = doc(db, "uscReports", editingReportId);
                await updateDoc(docRef, reportData);
              } else {
                reportData.createdAt = new Date();
                await addDoc(reportsCollectionRef, reportData);
              }
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
      const decodedPath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      return decodedPath;
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
              const reportDocRef = doc(db, "uscReports", id);
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
              Alert.alert("Success", "Report marked as resolved!");
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
      setImageDeletedLocally(false);
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
      setImageDeletedLocally(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageDeletedLocally(true);
  };

  const changesDone = () => {
    if (!originalReport) {
      return (
        value !== null ||
        issueValue !== null ||
        remarks.trim() !== "" ||
        imageUri !== null
      );
    } else {
      return (
        value !== originalReport.equipment ||
        issueValue !== originalReport.issueType ||
        remarks.trim() !== originalReport.remarks.trim() ||
        imageUri !== originalReport.imageUri ||
        (imageDeletedLocally && originalReport.imageUri !== null)
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

  const gymLocationUrl =
    "https://www.google.com/maps/place/University+Sports+Centre+(USC)/@1.2998711,103.7727105,1126m/data=!3m3!1e3!4b1!5s0x31da1a58061f6ed5:0xb19cc34786763a9a!4m6!3m5!1s0x31da1a58088dc0d9:0xd948b3a5838899e4!8m2!3d1.2998711!4d103.7752854!16s%2Fg%2F11f3m9cfg6?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D";

  const handleLink = () => {
    Linking.openURL(gymLocationUrl).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const dropdownListMode = Platform.OS === "android" ? "MODAL" : "SCROLLVIEW";

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <ThemedText style={{ fontSize: 22 }}>USC Reports</ThemedText>
              <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
                <ThemedText style={{ color: "white" }}>+</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 10, color: "#888" }}>
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
                    {item.remarks && (
                      <Text style={styles.cardRemarks}>
                        Remarks: {item.remarks}
                      </Text>
                    )}

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
        ListFooterComponent={
          <View
            style={{
              backgroundColor: "#7d015c",
              borderRadius: 20,
              padding: 15,
              marginTop: 20,
              paddingHorizontal: 20,
              marginHorizontal: 4,
            }}
          >
            <ThemedText style={{ fontSize: 18, color: "white" }}>
              Gym Details
            </ThemedText>

            <Spacer height={10} />

            <ThemedText style={{ color: "white" }}>Operating Hours:</ThemedText>
            <ThemedText style={{ color: "white" }}>
              Monday to Friday 0700hr to 2200hr
            </ThemedText>

            <ThemedText style={{ color: "white" }}>
              Weekends and Public Holidays 0700hr to 2200hr
            </ThemedText>

            <Spacer height={10} />

            <View style={styles.buttonicons}>
              <ThemedText style={{ color: "white" }}>Location: </ThemedText>

              <FontAwesome name="map-marker" size={24} color="red" />
              <ThemedText
                onPress={handleLink}
                style={{ color: "#007AFF", textDecorationLine: "underline" }}
              >
                University Sports Centre
              </ThemedText>
            </View>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelPress}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
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
                  listMode={dropdownListMode}
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
                  listMode={dropdownListMode}
                />
              </View>

              <Text style={{ marginBottom: 5 }}>Remarks (optional):</Text>
              <ThemedTextInput
                placeholder="Enter remarks"
                placeholderTextColor={"grey"}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
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
                    <TouchableOpacity
                      onPress={handleRemoveImage}
                      testID="removeImage"
                    >
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
                <ThemedButton
                  onPress={handleCancelPress}
                  style={{ backgroundColor: "grey" }}
                >
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

export default UscReports;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
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
