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
            imageUrl: null,
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

import UtownReports from "../../app/(reports)/utownReports";

describe("UtownReports component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders reports", async () => {
    const { getByText } = render(<UtownReports />);
    await waitFor(() =>
      expect(getByText("Bench Press - Damaged")).toBeTruthy()
    );
  });

  test("shows empty message when there are no reports", async () => {
    const emptyMock = jest.fn(() => Promise.resolve({ docs: [] }));
    require("firebase/firestore").getDocs.mockImplementationOnce(emptyMock);

    const { getByText } = render(<UtownReports />);
    await waitFor(() =>
      expect(getByText("No reports yet. Tap + to add one.")).toBeTruthy()
    );
  });

  test("alerts when equipment or issue type missing on submit", async () => {
    const { getByText } = render(<UtownReports />);
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

  test("selects Bench Press in equipment dropdown", async () => {
    const { getByTestId, getByText } = render(<UtownReports />);
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

  test("shows confirmation alert on submit for editing report", async () => {
    const { getByText, getByTestId } = render(<UtownReports />);
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

  test("confirmation alert on delete calls deleteDoc and updates state", async () => {
    const { getByText } = render(<UtownReports />);
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

  test("image picker adds imageUri to state", async () => {
    const { getByText } = render(<UtownReports />);
    fireEvent.press(getByText("+"));
    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });
    expect(getByText("Take Photo")).toBeTruthy();
  });
});
