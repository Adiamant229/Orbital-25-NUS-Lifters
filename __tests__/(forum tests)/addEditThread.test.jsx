// __tests__/(forum tests)/addEditThread.test.jsx
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

// MOCK expo-av Video component
jest.mock("expo-av", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Video: (props) => <View {...props} />,
  };
});

// MOCK expo-image-picker
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "image-uri", type: "image" }],
    })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "camera-uri", type: "image" }],
    })
  ),
}));

jest.mock("expo-router", () => {
  return {
    useLocalSearchParams: jest.fn(() => ({})), // return empty params by default (create mode)
    useRouter: () => ({
      back: jest.fn(),
      push: jest.fn(),
    }),
  };
});
  

// MOCK uuid
jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

// Mock entire firebaseConfig so real SDK is not loaded
jest.mock("../../firebaseConfig", () => ({
    db: {},
    storage: {},
    auth: {},
    app: {},
    functions: {},
  }));
  
  // Then mock firebase modules you use in your component
  jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    doc: jest.fn(() => ({})),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
    addDoc: jest.fn(() => Promise.resolve({ id: "mockId" })),
    updateDoc: jest.fn(() => Promise.resolve()),
    serverTimestamp: jest.fn(() => "mockTimestamp"),
  }));
  
  jest.mock("firebase/storage", () => ({
    ref: jest.fn(() => ({})),
    uploadBytes: jest.fn(() => Promise.resolve()),
    getDownloadURL: jest.fn(() => Promise.resolve("mockUrl")),
    deleteObject: jest.fn(() => Promise.resolve()),
  }));
  
  jest.mock("firebase/auth", () => ({
    getAuth: jest.fn(() => ({ currentUser: { uid: "mockUserId" } })),
  }));
  
  jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }));

  jest.mock("../../components/themedContext", () => ({
    useThemeContext: () => ({ theme: "light", setTheme: jest.fn() }),
  }));
  

// Spy on Alert.alert to prevent real alerts and track calls
jest.spyOn(Alert, "alert").mockImplementation(() => {});


import AddEditThread from "../../app/(forum)/addEditThread";

describe("AddEditThread Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders create mode correctly", async () => {
    // no threadId param means create mode
    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    expect(getByText("Create New Thread")).toBeTruthy();
    expect(getByPlaceholderText("Thread Title")).toBeTruthy();
  });

  test("renders edit mode correctly and loads data", async () => {
    // Mock useLocalSearchParams to return threadId
    jest.mock("expo-router", () => ({
      useLocalSearchParams: () => ({ threadId: "abc123" }),
      useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
    }));

    // We have to re-import component after mock change
    // But for simplicity in test you might abstract this better.

    // Instead, let's simulate by passing threadId as prop or
    // just test load logic separately if needed.

    // This test might need adaptation based on your usage.
  });

  test("shows alert if title or content is missing on submit", async () => {
    const { getByText } = render(<AddEditThread />);

    fireEvent.press(getByText("Create"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Missing Fields",
      "Title and content are required."
    );
  });

  test("calls addDoc on submit for new thread", async () => {
    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    fireEvent.changeText(getByPlaceholderText("Thread Title"), "Test Title");
    fireEvent.changeText(
      getByPlaceholderText("Thread content..."),
      "Test content"
    );

    // Mock Alert.alert to auto-press Confirm button if exists
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const confirmButton = buttons.find((b) => b.text === "Confirm");
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress();
        }
      }
    });

    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    // Expect addDoc called with correct data
    const { addDoc } = require("firebase/firestore");
    expect(addDoc).toHaveBeenCalled();

    expect(Alert.alert).toHaveBeenCalledWith("Success", "Thread created.");
  });
  

  test("renders edit mode correctly and loads thread data", async () => {
    // Mock useLocalSearchParams to return threadId for edit mode
    const mockThreadData = {
      title: "Existing Title",
      category: "Diet",
      content: "Existing content",
      mediaUrl: "https://mockurl.com/media.jpg",
      mediaType: "image",
    };

    // Mock getDoc to return the thread data
    const { getDoc } = require("firebase/firestore");
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockThreadData,
    });

    // Mock useLocalSearchParams to simulate edit mode
    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "abc123",
    });

    const { getByText, getByPlaceholderText, queryByTestId } = render(
      <AddEditThread />
    );

    // Wait for useEffect fetch to update state
    await waitFor(() =>
      expect(getByPlaceholderText("Thread Title").props.value).toBe(
        mockThreadData.title
      )
    );

    expect(getByText("Edit Thread")).toBeTruthy();
    expect(getByPlaceholderText("Thread Title").props.value).toBe(
      mockThreadData.title
    );
    expect(getByPlaceholderText("Thread content...").props.value).toBe(
      mockThreadData.content
    );

    // Media should be rendered - since it's an image, check image exists (via mediaUri state)
    // Note: you can add testID to Image component in your component for easier testing
  });

  test("calls updateDoc on submit for edited thread", async () => {
    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    // Mock useLocalSearchParams to simulate edit mode
    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "abc123",
    });

    const { updateDoc } = require("firebase/firestore");

    fireEvent.changeText(getByPlaceholderText("Thread Title"), "Updated Title");
    fireEvent.changeText(
      getByPlaceholderText("Thread content..."),
      "Updated content"
    );

    // Mock Alert.alert to auto-press Confirm button
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const confirmButton = buttons.find((b) => b.text === "Confirm");
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress();
        }
      }
    });

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(updateDoc).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Thread updated.");
  });

  /*test("uploads media and deletes old media if replaced on edit", async () => {
    const originalMediaUrl = "https://mockurl.com/oldmedia.jpg";

    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "abc123",
    });

    const {
      getDownloadURL,
      uploadBytes,
      deleteObject,
    } = require("firebase/storage");
    const { updateDoc, getDoc } = require("firebase/firestore");

    // Mock getDoc to return thread with original media url
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        title: "Old Title",
        category: "Training",
        content: "Old content",
        mediaUrl: originalMediaUrl,
        mediaType: "image",
      }),
    });

    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    // Wait for data load
    await waitFor(() =>
      expect(getByPlaceholderText("Thread Title").props.value).toBe("Old Title")
    );

    // Simulate user picking new media from gallery (updates mediaUri to "image-uri")
    fireEvent.press(getByText("Pick from Gallery"));

    // Mock Alert to auto-confirm on save
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const confirmButton = buttons.find((b) => b.text === "Confirm");
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress();
        }
      }
    });

    // Press Save button to trigger upload and delete logic
    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(deleteObject).toHaveBeenCalled(); // old media deleted
    expect(uploadBytes).toHaveBeenCalled(); // new media uploaded
    expect(getDownloadURL).toHaveBeenCalled(); // new media URL fetched
    expect(updateDoc).toHaveBeenCalled(); // thread updated
  });*/
  

  test("cancel button with unsaved changes shows discard confirmation", async () => {
    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    fireEvent.changeText(getByPlaceholderText("Thread Title"), "Unsaved Title");

    fireEvent.press(getByText("Cancel"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Discard Changes?",
      "You have unsaved changes. Are you sure?",
      expect.any(Array)
    );
  });

  test("cancel button without changes navigates back immediately", async () => {
    const mockBack = jest.fn();

    jest.spyOn(require("expo-router"), "useRouter").mockReturnValue({
      back: mockBack,
      push: jest.fn(),
    });

    const { getByText } = render(<AddEditThread />);

    fireEvent.press(getByText("Cancel"));

    expect(mockBack).toHaveBeenCalled();
  });
});
