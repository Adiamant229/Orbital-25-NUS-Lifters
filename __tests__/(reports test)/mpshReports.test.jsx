import React from "react";
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
          id: "1",
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

import MpshReports from "../../app/(reports)/mpshReports"; 

describe("MpshReports component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders reports", async () => {
    const { getByText } = render(<MpshReports />);
    await waitFor(() =>
      expect(getByText("Bench Press - Damaged")).toBeTruthy()
    );
  });

  test("alerts when equipment or issue type missing on submit", async () => {
    const { getByText } = render(<MpshReports />);
    act(() => {
      fireEvent.press(getByText("+")); // open modal for add
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
    const { getByTestId, getByText } = render(<MpshReports />);

    // Open the add modal
    act(() => {
      fireEvent.press(getByText("+"));
    });

    // Select equipment by pressing mocked dropdown option
    act(() => {
      fireEvent.press(getByTestId("select-bench-press"));
    });

    // Select issue type similarly
    act(() => {
      fireEvent.press(getByTestId("select-damaged"));
    });

    // Submit form
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
    const { getByText, getByTestId } = render(<MpshReports />);

    await waitFor(() => getByText("Bench Press - Damaged"));

    // Expand the report item by pressing its title
    act(() => {
      fireEvent.press(getByText("Bench Press - Damaged"));
    });

    // Wait for the edit icon to appear (only visible when expanded)
    const editIcon = await waitFor(() => getByTestId("edit-icon-1"));

    // Press the edit icon to open the edit modal
    act(() => {
      fireEvent.press(editIcon);
    });

    // Select equipment by pressing mocked dropdown option in edit modal
    act(() => {
      fireEvent.press(getByTestId("select-bench-press"));
    });

    // Select issue type similarly
    act(() => {
      fireEvent.press(getByTestId("select-damaged"));
    });

    // Press Save to submit edit
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
    const { getByText } = render(<MpshReports />);
    await waitFor(() => getByText("Bench Press - Damaged"));

    // Expand report
    act(() => {
      fireEvent.press(getByText("Bench Press - Damaged"));
    });

    // Press Resolve button to delete with alert confirmation
    await act(async () => {
      fireEvent.press(getByText("Resolved"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Resolve Report",
      "Are you sure you want to mark this report as resolved?",
      expect.any(Array)
    );
  });
});
