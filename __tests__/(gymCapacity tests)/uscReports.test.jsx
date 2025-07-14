import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as uuid from "uuid";

jest.mock("../../firebaseConfig", () => ({
  auth: {},
  db: {},
  storage: {},
  app: {},
  functions: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => []),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: "1",
          data: () => ({
            equipment: "Bench Press",
            issueType: "Damaged",
            remarks: "Test remark",
            userId: "user1",
            imageUrl: "https://fakeimage.url/image.jpg",
          }),
        },
      ],
    })
  ),
  addDoc: jest.fn(() => Promise.resolve({ id: "newDocId" })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ imageUrl: "https://fakeimage.url/image.jpg" }),
    })
  ),
  doc: jest.fn(() => ({})),
  deleteField: jest.fn(() => "deleteField"),
  query: jest.fn((ref) => ref),
  onSnapshot: jest.fn((q, callback) => {
    callback({
      docs: [
        {
          id: "1",
          data: () => ({
            equipment: "Bench Press",
            issueType: "Damaged",
            remarks: "Test remark",
            userId: "user1",
            imageUrl: "https://fakeimage.url/image.jpg",
          }),
        },
      ],
    });
    return jest.fn();
  }),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve("http://image.url")),
  deleteObject: jest.fn(() => Promise.resolve()),
}));

jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: { uid: "user1" },
  }),
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://mock-image-uri" }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: "mock-camera-uri" }] })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { TouchableOpacity, Text, View } = require("react-native");
  return (props) =>
    React.createElement(
      View,
      null,
      props.items.map((item) =>
        React.createElement(
          TouchableOpacity,
          {
            key: item.value,
            testID: `select-${item.value.toLowerCase().replace(/\s/g, "-")}`,
            onPress: () => props.setValue(item.value),
          },
          React.createElement(Text, null, item.label)
        )
      )
    );
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("../../components/themedContext", () => ({
  useThemeContext: () => ({ theme: "light", setTheme: jest.fn() }),
}));

jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
  if (buttons) {
    const positiveButton = buttons.find(
      (b) => b.style !== "cancel" && typeof b.onPress === "function"
    );
    if (positiveButton) {
      positiveButton.onPress();
    }
  }
});
jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-uuid"),
}));

jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

import UscReports from "../../app/(reports)/uscReports";

describe("UscReports component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders reports", async () => {
    const { getByText } = render(<UscReports />);
    await waitFor(() =>
      expect(getByText("Bench Press - Damaged")).toBeTruthy()
    );
  });

  test("shows empty message when there are no reports", async () => {
    const firestore = require("firebase/firestore");

    firestore.onSnapshot.mockImplementationOnce((query, callback) => {
      callback({ docs: [] });
      return jest.fn();
    });

    const { getByText } = render(<UscReports />);
    await waitFor(() =>
      expect(getByText("No reports yet. Tap + to add one.")).toBeTruthy()
    );
  });

  test("able to create a report without remarks and photos", async () => {
    const { getByTestId, getByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));
    fireEvent.press(getByTestId("select-bench-press"));
    fireEvent.press(getByTestId("select-damaged"));

    await act(async () => {
      fireEvent.press(getByText("Submit"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Submit Report",
      "Are you sure you want to submit this report?",
      expect.any(Array)
    );
  });

  test("alerts when equipment or issue type missing on submit", async () => {
    const { getByText } = render(<UscReports />);
    act(() => {
      fireEvent.press(getByText("+"));
    });

    await act(async () => {
      fireEvent.press(getByText("Submit"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      expect.any(String),
      "Please select equipment and issue type."
    );
  });

  test("alerts if camera permission is denied", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    require("expo-image-picker").requestCameraPermissionsAsync.mockImplementationOnce(
      () => Promise.resolve({ granted: false })
    );

    const { getByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Take Photo"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Permission to access camera is required!"
    );
  });

  test("image picker adds imageUri to state", async () => {
    const { getByText, getByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(getByTestId("image-preview")).toBeTruthy();
  });

  test("does not set imageUri when image picker is cancelled", async () => {
    require("expo-image-picker").launchImageLibraryAsync.mockImplementationOnce(
      () => Promise.resolve({ canceled: true })
    );

    const { getByText, queryByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(queryByText("Take Photo")).toBeTruthy();
  });

  test("alerts when cancelling creating a new report with changes", async () => {
    const { getByTestId, getByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));
    fireEvent.press(getByTestId("select-bench-press"));

    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Cancel New Report?",
      "You have started creating a new report. Are you sure you want to cancel?",
      expect.any(Array)
    );
  });

  test("cancelling modal resets state", async () => {
    const { getByText, queryByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });

    expect(queryByText("Submit")).toBeNull();
  });

  test("shows confirmation alert on submit for editing report", async () => {
    const { getByText, getByTestId } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));

    act(() => {
      fireEvent.press(getByText("Bench Press - Damaged"));
    });

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);
    fireEvent.press(getByTestId("select-bench-press"));
    fireEvent.press(getByTestId("select-damaged"));

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Update Report",
      "Are you sure you want to update this report?",
      expect.any(Array)
    );
  });

  test("alerts when cancelling editing a report with changes", async () => {
    const { getByText, queryByText, getByTestId } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));

    fireEvent.press(getByText("Bench Press - Damaged"));

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);

    fireEvent.press(getByTestId("select-missing"));

    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Discard Changes?",
      "You have unsaved changes. Are you sure you want to discard them?",
      expect.any(Array)
    );
  });

  test("cancel editing resets state", async () => {
    const { getByText, queryByText, getByTestId } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));

    fireEvent.press(getByText("Bench Press - Damaged"));

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);

    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });

    expect(queryByText("Save")).toBeNull();
  });

  test("submits edit even without changes", async () => {
    const { getByText, getByTestId } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));

    fireEvent.press(getByText("Bench Press - Damaged"));

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Update Report",
      "Are you sure you want to update this report?",
      expect.any(Array)
    );
  });

  test("image picker adds imageUri to state", async () => {
    const { getByText, getByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(getByTestId("image-preview")).toBeTruthy();
  });

  test("confirmation alert on resolved calls deleteDoc and updates state", async () => {
    const { getByText } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));

    fireEvent.press(getByText("Bench Press - Damaged"));
    await act(async () => {
      fireEvent.press(getByText("Resolved"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Resolve Report",
      "Are you sure you want to mark this report as resolved?",
      expect.any(Array)
    );
  });

  test("handles Firestore fetch error gracefully", async () => {
    const firestore = require("firebase/firestore");
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    firestore.onSnapshot.mockImplementationOnce((query, onNext, onError) => {
      onError(new Error("Firestore failure"));
      return () => {};
    });

    render(<UscReports />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching real-time reports:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test("handles Firestore error during submit", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, "alert");

    const mockError = new Error("Failed to add doc");
    require("firebase/firestore").addDoc.mockImplementationOnce(() =>
      Promise.reject(mockError)
    );

    alertSpy.mockImplementation((title, message, buttons) => {
      const confirmBtn = buttons?.find(
        (btn) => btn.text?.toLowerCase().includes("submit") || btn.text === "OK"
      );
      if (confirmBtn?.onPress) confirmBtn.onPress();
    });

    const { getByText, getByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));
    fireEvent.press(getByTestId("select-bench-press"));
    fireEvent.press(getByTestId("select-damaged"));

    await act(async () => {
      fireEvent.press(getByText("Submit"));
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error submitting report:",
      mockError
    );
    expect(alertSpy).toHaveBeenCalledWith("Failed to submit report.");

    consoleSpy.mockRestore();
  });

  describe("UscReports component - image URL logic in submit", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          if (buttons) {
            const positiveButton = buttons.find(
              (b) => b.style !== "cancel" && typeof b.onPress === "function"
            );
            if (positiveButton) {
              positiveButton.onPress();
            }
          }
        });
    });

    test("uploads new local image and deletes old image when editing report", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          blob: () => Promise.resolve("blob-data"),
        })
      );

      const firestore = require("firebase/firestore");
      const storage = require("firebase/storage");

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ imageUrl: "https://fakeimage.url/oldimage.jpg" }),
      });

      jest.spyOn(uuid, "v4").mockReturnValue("fixed-uuid");

      const { getByText, getByTestId, queryByTestId } = render(<UscReports />);

      await waitFor(() => getByText("Bench Press - Damaged"));
      fireEvent.press(getByText("Bench Press - Damaged"));

      const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
      fireEvent.press(editIcon);

      await act(async () => {
        fireEvent.press(getByText("Pick from Gallery"));
      });

      await waitFor(() => getByTestId("image-preview"));

      await act(async () => {
        fireEvent.press(getByText("Save"));
      });

      expect(global.fetch).toHaveBeenCalled();

      expect(storage.uploadBytes).toHaveBeenCalled();

      expect(storage.getDownloadURL).toHaveBeenCalled();

      expect(storage.deleteObject).toHaveBeenCalled();

      expect(firestore.updateDoc).toHaveBeenCalled();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        expect.stringContaining("updated")
      );
    });

    test("deletes old image when imageDeletedLocally is true during edit", async () => {
      const firestore = require("firebase/firestore");
      const storage = require("firebase/storage");

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ imageUrl: "https://fakeimage.url/oldimage.jpg" }),
      });

      const { getByText, getByTestId } = render(<UscReports />);
      await waitFor(() => getByText("Bench Press - Damaged"));
      fireEvent.press(getByText("Bench Press - Damaged"));

      const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
      fireEvent.press(editIcon);

      fireEvent.press(getByTestId("removeImage"));

      await act(async () => {
        fireEvent.press(getByText("Save"));
      });

      expect(storage.deleteObject).toHaveBeenCalled();
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ imageUrl: firestore.deleteField() })
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        expect.stringContaining("updated")
      );
    });

    test("keeps existing image URL unchanged when editing without changing image", async () => {
      const firestore = require("firebase/firestore");

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ imageUrl: "https://fakeimage.url/existing.jpg" }),
      });

      const { getByText, getByTestId } = render(<UscReports />);
      await waitFor(() => getByText("Bench Press - Damaged"));
      fireEvent.press(getByText("Bench Press - Damaged"));

      const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
      fireEvent.press(editIcon);

      await waitFor(() => fireEvent.press(getByText("Save")));

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          imageUrl: "https://fakeimage.url/image.jpg",
        })
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        expect.stringContaining("updated")
      );
    });

    test("creates new report with image upload", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          blob: () => Promise.resolve("blob-data"),
        })
      );

      const firestore = require("firebase/firestore");
      const storage = require("firebase/storage");

      jest.spyOn(uuid, "v4").mockReturnValue("fixed-uuid");

      const { getByText, getByTestId } = render(<UscReports />);
      fireEvent.press(getByText("+"));

      fireEvent.press(getByTestId("select-bench-press"));
      fireEvent.press(getByTestId("select-damaged"));
      fireEvent.press(getByText("Pick from Gallery"));

      await waitFor(() => {
        expect(getByTestId("image-preview")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText("Submit"));
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(storage.uploadBytes).toHaveBeenCalled();
      expect(storage.getDownloadURL).toHaveBeenCalled();
      expect(firestore.addDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        expect.stringContaining("submitted")
      );
    });

    test("creates new report without image", async () => {
      const firestore = require("firebase/firestore");

      const { getByText, getByTestId } = render(<UscReports />);
      fireEvent.press(getByText("+"));

      fireEvent.press(getByTestId("select-bench-press"));
      fireEvent.press(getByTestId("select-damaged"));

      await act(async () => {
        fireEvent.press(getByText("Submit"));
      });

      expect(firestore.addDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        expect.stringContaining("submitted")
      );
    });
  });

  test("warns when deleting old image fails during new image upload on edit", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const firestore = require("firebase/firestore");
    const storage = require("firebase/storage");

    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ imageUrl: "https://fakeimage.url/oldimage.jpg" }),
    });

    storage.deleteObject.mockRejectedValueOnce(
      new Error("Storage delete failed")
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve("blob-data"),
      })
    );

    const uuid = require("uuid");
    jest.spyOn(uuid, "v4").mockReturnValue("fixed-uuid");

    const { getByText, getByTestId } = render(<UscReports />);

    await waitFor(() => getByText("Bench Press - Damaged"));
    fireEvent.press(getByText("Bench Press - Damaged"));

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    await waitFor(() => getByTestId("image-preview"));

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to delete old image:",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  test("warns when deleting old image locally fails during edit", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const firestore = require("firebase/firestore");
    const storage = require("firebase/storage");

    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ imageUrl: "https://fakeimage.url/oldimage.jpg" }),
    });

    storage.deleteObject.mockRejectedValueOnce(
      new Error("Local delete failed")
    );

    const { getByText, getByTestId } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));
    fireEvent.press(getByText("Bench Press - Damaged"));

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);

    fireEvent.press(getByTestId("removeImage"));

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to delete old image locally:",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  test("sets imageUrl to deleteField() when editing report with old image and image removed", async () => {
    const firestore = require("firebase/firestore");
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ imageUrl: "https://fakeimage.url/oldimage.jpg" }),
    });

    const updateDocSpy = jest.spyOn(firestore, "updateDoc");

    const { getByText, getByTestId } = render(<UscReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));
    fireEvent.press(getByText("Bench Press - Damaged"));

    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));
    fireEvent.press(editIcon);

    fireEvent.press(getByTestId("removeImage"));

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(updateDocSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ imageUrl: firestore.deleteField() })
    );
  });
  test("alerts if media library permission denied on pickImage", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    require("expo-image-picker").requestMediaLibraryPermissionsAsync.mockImplementationOnce(
      () => Promise.resolve({ granted: false })
    );

    const { getByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Permission to access media library is required!"
    );
  });

  test("alerts if camera permission denied on takePhoto", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    require("expo-image-picker").requestCameraPermissionsAsync.mockImplementationOnce(
      () => Promise.resolve({ granted: false })
    );

    const { getByText } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Take Photo"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Permission to access camera is required!"
    );
  });

  test("sets imageUri state when pickImage succeeds", async () => {
    require("expo-image-picker").requestMediaLibraryPermissionsAsync.mockImplementationOnce(
      () => Promise.resolve({ granted: true })
    );
    require("expo-image-picker").launchImageLibraryAsync.mockImplementationOnce(
      () =>
        Promise.resolve({
          canceled: false,
          assets: [{ uri: "file://mock-image-uri-pick" }],
        })
    );

    const { getByText, getByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(getByTestId("image-preview")).toBeTruthy();
  });

  test("sets imageUri state when takePhoto succeeds", async () => {
    require("expo-image-picker").requestCameraPermissionsAsync.mockImplementationOnce(
      () => Promise.resolve({ granted: true })
    );
    require("expo-image-picker").launchCameraAsync.mockImplementationOnce(() =>
      Promise.resolve({
        canceled: false,
        assets: [{ uri: "file://mock-image-uri-camera" }],
      })
    );

    const { getByText, getByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Take Photo"));
    });

    expect(getByTestId("image-preview")).toBeTruthy();
  });

  test("does not set imageUri when pickImage is cancelled", async () => {
    require("expo-image-picker").launchImageLibraryAsync.mockImplementationOnce(
      () => Promise.resolve({ canceled: true })
    );

    const { getByText, queryByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(queryByTestId("image-preview")).toBeNull();
  });

  test("does not set imageUri when takePhoto is cancelled", async () => {
    require("expo-image-picker").launchCameraAsync.mockImplementationOnce(() =>
      Promise.resolve({ canceled: true })
    );

    const { getByText, queryByTestId } = render(<UscReports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Take Photo"));
    });

    expect(queryByTestId("image-preview")).toBeNull();
  });
});
