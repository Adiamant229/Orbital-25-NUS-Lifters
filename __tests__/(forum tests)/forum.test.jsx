// __tests__/(forum tests)/forum.test.jsx
import React from "react";
import { View, Text, Alert } from "react-native";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock react-native-dropdown-picker to simplify dropdown in tests
jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return (props) =>
    React.createElement(
      View,
      null,
      props.items.map((item) =>
        React.createElement(
          Text,
          { key: item.value, onPress: () => props.setValue(item.value) },
          item.label
        )
      )
    );
});

// Mock expo-router with internal push mock function
jest.mock("expo-router", () => {
  const push = jest.fn();
  return {
    useRouter: () => ({
      push,
    }),
    __pushMock: push,
  };
});

// Mock firebaseConfig completely
jest.mock("../../firebaseConfig", () => ({
  auth: {},
  db: {},
  storage: {},
  app: {},
  functions: {},
}));

// Mock firebase/firestore methods
const mockThread = {
  title: "Test Thread",
  category: "Training",
  author: "TestUser",
  authorId: "user1",
  content: "This is a test thread",
  createdAt: { toMillis: () => Date.now() },
  likes: 3,
  likedBy: ["user2"],
};

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => []),
  query: jest.fn((ref) => ref),
  where: jest.fn(() => []),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => mockThread,
    })
  ),
  deleteDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  addDoc: jest.fn(() => Promise.resolve({ id: "newThread" })),
  onSnapshot: jest.fn((q, callback) => {
    callback({
      docs: [
        {
          id: "1",
          data: () => mockThread,
        },
      ],
      forEach: (fn) => {
        fn({
          id: "1",
          data: () => mockThread,
        });
      },
    });
    return jest.fn(); // unsubscribe mock
  }),
}));

// Mock firebase/auth
jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: { uid: "user1" },
  }),
}));

// Mock firebase/storage methods
jest.mock("firebase/storage", () => ({
  deleteObject: jest.fn(() => Promise.resolve()),
  ref: jest.fn(() => ({})),
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


// Spy and mock Alert.alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

// Import Forum AFTER mocks
import Forum from "../../app/(dashboard)/forum";

const { __pushMock } = jest.requireMock("expo-router");

describe("Forum Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __pushMock.mockClear();
  });

  test("renders thread cards from Firestore", async () => {
    const { getByText } = render(<Forum />);
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());
    expect(getByText("Test Thread")).toBeTruthy();
    expect(getByText("Training")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
  });

  test("clicking category filter buttons updates view", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("All"));
    fireEvent.press(getByText("Training"));
    fireEvent.press(getByText("Diet"));
    fireEvent.press(getByText("Cardio"));
  });

  test("pressing + navigates to addEditThread page", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("+"));
    expect(__pushMock).toHaveBeenCalledWith("/(forum)/addEditThread");
  });


  test("DropDownPicker sorting by likes works", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("Most Liked"));
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());
  });

  test("DropDownPicker sorting by newest works", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("Newest"));
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());
  });

  test("deleting own thread calls deleteDoc and shows confirmation alert", async () => {
    const { getByTestId, getByText } = render(<Forum />);
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());

    // Fire the delete button press
    fireEvent.press(getByTestId("delete-thread-button"));
    expect(Alert.alert).toHaveBeenCalled();

    // Find the alert dialog with title "Delete Thread"
    const alertCall = Alert.alert.mock.calls.find(
      ([title]) => title === "Delete Thread"
    );
    const buttons = alertCall[2];
    const deleteButton = buttons.find((btn) => btn.text === "Delete");

    // Simulate pressing the Delete button inside alert
    await act(async () => {
      await deleteButton.onPress();
    });

    // Check if deleteDoc called and success alert shown
    expect(deleteDoc).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Deleted",
      "Thread removed successfully."
    );
  });

  test("alerts error if thread does not exist", async () => {
    // Mock getDoc to simulate thread not found
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const { getByTestId, getByText } = render(<Forum />);
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());

    // Fire the delete button press
    fireEvent.press(getByTestId("delete-thread-button"));
    expect(Alert.alert).toHaveBeenCalled();

    // Find the alert dialog with title "Delete Thread"
    const alertCall = Alert.alert.mock.calls.find(
      ([title]) => title === "Delete Thread"
    );
    const buttons = alertCall[2];
    const deleteButton = buttons.find((btn) => btn.text === "Delete");

    // Simulate pressing the Delete button inside alert
    await act(async () => {
      await deleteButton.onPress();
    });

    // Check error alert called for "Thread not found"
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Thread not found.");
  });
});
