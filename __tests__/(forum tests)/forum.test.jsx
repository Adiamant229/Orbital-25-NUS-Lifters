import { Alert } from "react-native";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import Forum, { deleteThread } from "../../app/(dashboard)/forum";

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

jest.mock("expo-router", () => {
  const push = jest.fn();
  return {
    useRouter: () => ({
      push,
    }),
    __pushMock: push,
  };
});

jest.mock("../../firebaseConfig", () => ({
  auth: {},
  db: {},
  storage: {},
  app: {},
  functions: {},
}));

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
    return jest.fn();
  }),
}));

jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: { uid: "user1" },
  }),
}));

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

jest.spyOn(Alert, "alert").mockImplementation(() => {});

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

    fireEvent.press(getByTestId("delete-thread-button"));
    expect(Alert.alert).toHaveBeenCalled();

    const alertCall = Alert.alert.mock.calls.find(
      ([title]) => title === "Delete Thread"
    );
    const buttons = alertCall[2];
    const deleteButton = buttons.find((btn) => btn.text === "Delete");

    await act(async () => {
      await deleteButton.onPress();
    });

    expect(deleteDoc).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Deleted",
      "Thread removed successfully."
    );
  });

  test("alerts error if thread does not exist", async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const { getByTestId, getByText } = render(<Forum />);
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());

    fireEvent.press(getByTestId("delete-thread-button"));
    expect(Alert.alert).toHaveBeenCalled();

    const alertCall = Alert.alert.mock.calls.find(
      ([title]) => title === "Delete Thread"
    );
    const buttons = alertCall[2];
    const deleteButton = buttons.find((btn) => btn.text === "Delete");

    await act(async () => {
      await deleteButton.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Thread not found.");
  });

  describe("deleteThread function", () => {
    const threadId = "thread123";

    beforeEach(() => {
      jest.clearAllMocks();
      Alert.alert.mockImplementation(() => {});
      console.warn = jest.fn();
      console.error = jest.fn();
    });

    test("deletes thread and media successfully", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          mediaUrl:
            "https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/media%2Ffile.jpg?alt=media",
        }),
      });
      deleteObject.mockResolvedValueOnce();
      deleteDoc.mockResolvedValueOnce();

      await deleteThread(threadId);

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Thread",
        "Are you sure you want to delete this thread?",
        expect.any(Array)
      );

      const buttons =
        Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2];
      const deleteButton = buttons.find((b) => b.text === "Delete");

      await act(async () => {
        await deleteButton.onPress();
      });

      expect(doc).toHaveBeenCalledWith(expect.anything(), "threads", threadId);
      expect(getDoc).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(expect.anything(), "media/file.jpg");
      expect(deleteObject).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Deleted",
        "Thread removed successfully."
      );
    });

    test("deletes thread without mediaUrl", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      });
      deleteDoc.mockResolvedValueOnce();

      await deleteThread(threadId);

      const buttons =
        Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2];
      const deleteButton = buttons.find((b) => b.text === "Delete");

      await act(async () => {
        await deleteButton.onPress();
      });

      expect(deleteObject).not.toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Deleted",
        "Thread removed successfully."
      );
    });

    test("alerts error if thread not found", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await deleteThread(threadId);

      const buttons =
        Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2];
      const deleteButton = buttons.find((b) => b.text === "Delete");

      await act(async () => {
        await deleteButton.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith("Error", "Thread not found.");
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    test("warns but continues if media deletion fails", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          mediaUrl:
            "https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/media%2Ffile.jpg?alt=media",
        }),
      });
      deleteObject.mockRejectedValueOnce(new Error("Storage failure"));
      deleteDoc.mockResolvedValueOnce();

      await deleteThread(threadId);

      const buttons =
        Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2];
      const deleteButton = buttons.find((b) => b.text === "Delete");

      await act(async () => {
        await deleteButton.onPress();
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to delete media file:",
        expect.any(Error)
      );
      expect(deleteDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Deleted",
        "Thread removed successfully."
      );
    });

    test("alerts error if deleteDoc fails", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      });
      deleteDoc.mockRejectedValueOnce(new Error("Firestore failure"));

      await deleteThread(threadId);

      const buttons =
        Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2];
      const deleteButton = buttons.find((b) => b.text === "Delete");

      await act(async () => {
        await deleteButton.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Could not delete thread."
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error deleting thread: ",
        expect.any(Error)
      );
    });
  });
});
