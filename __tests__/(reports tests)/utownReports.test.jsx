import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

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
  doc: jest.fn(() => ({})),
  deleteField: jest.fn(() => "deleteField"),
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
    Promise.resolve({ canceled: false, assets: [{ uri: "mock-image-uri" }] })
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

import Utownreports from "../../app/(reports)/utownReports";

describe("Utownreports component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders reports", async () => {
    const { getByText } = render(<Utownreports />);
    await waitFor(() =>
      expect(getByText("Bench Press - Damaged")).toBeTruthy()
    );
  });

  test("shows empty message when there are no reports", async () => {
    const emptyMock = jest.fn(() => Promise.resolve({ docs: [] }));
    require("firebase/firestore").getDocs.mockImplementationOnce(emptyMock);

    const { getByText } = render(<Utownreports />);
    await waitFor(() =>
      expect(getByText("No reports yet. Tap + to add one.")).toBeTruthy()
    );
  });

  test("able to create a report without remarks and photos", async () => {
    const { getByTestId, getByText } = render(<Utownreports />);
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
    const { getByText } = render(<Utownreports />);
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

    const { getByText } = render(<Utownreports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Take Photo"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Permission to access camera is required!"
    );
  });

  test("image picker adds imageUri to state", async () => {
    const { getByText } = render(<Utownreports />);
    fireEvent.press(getByText("+"));
    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });
    expect(getByText("Take Photo")).toBeTruthy();
  });

  test("does not set imageUri when image picker is cancelled", async () => {
    require("expo-image-picker").launchImageLibraryAsync.mockImplementationOnce(
      () => Promise.resolve({ canceled: true })
    );

    const { getByText, queryByText } = render(<Utownreports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    expect(queryByText("Take Photo")).toBeTruthy();
  });

  test("cancelling modal resets state", async () => {
    const { getByText, queryByText } = render(<Utownreports />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });

    expect(queryByText("Submit")).toBeNull();
  });

  test("shows confirmation alert on submit for editing report", async () => {
    const { getByText, getByTestId } = render(<Utownreports />);
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

  test("cancel editing resets state", async () => {
    const { getByText, queryByText, getByTestId } = render(<Utownreports />);
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
    const { getByText, getByTestId } = render(<Utownreports />);
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

  test("expands a report card to view remarks and image", async () => {
    const { getByText, queryByText, getByTestId } = render(<Utownreports />);

    const reportTitle = await waitFor(() => getByText("Bench Press - Damaged"));

    expect(queryByText("Remarks: Test remark")).toBeNull();

    fireEvent.press(reportTitle);

    expect(getByText("Remarks: Test remark")).toBeTruthy();

    expect(getByTestId("report-image-1")).toBeTruthy();
  });

  test("confirmation alert on resolved calls deleteDoc and updates state", async () => {
    const { getByText } = render(<Utownreports />);
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
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    require("firebase/firestore").getDocs.mockImplementationOnce(() => {
      throw new Error("Firestore failure");
    });

    render(<Utownreports />);
    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching reports:",
        expect.any(Error)
      )
    );
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

    const { getByText, getByTestId } = render(<Utownreports />);
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
});
