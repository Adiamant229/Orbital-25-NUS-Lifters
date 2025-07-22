import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AddEditThread from "../../app/(forum)/addEditThread";

jest.mock("expo-av", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Video: (props) => <View testID="thread-video" {...props} />,
  };
});

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "new-image-uri", type: "image" }],
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
  const actual = jest.requireActual("expo-router");
  return {
    ...actual,
    useLocalSearchParams: jest.fn(() => ({})),
    useRouter: () => ({
      back: jest.fn(),
      push: jest.fn(),
    }),
  };
});

jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

jest.mock("../../firebaseConfig", () => ({
  db: {},
  storage: {},
  auth: {},
  app: {},
  functions: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({ exists: () => true, data: () => ({}) })
  ),
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

jest.spyOn(Alert, "alert").mockImplementation(() => {});

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      blob: jest.fn(() => Promise.resolve("mockBlob")),
    })
  );
  global.Blob = class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AddEditThread Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders create mode correctly", async () => {
    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    expect(getByText("Create New Thread")).toBeTruthy();
    expect(getByPlaceholderText("Thread Title")).toBeTruthy();
  });

  test("renders edit mode correctly and loads data", async () => {
    jest.mock("expo-router", () => ({
      useLocalSearchParams: () => ({ threadId: "abc123" }),
      useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
    }));
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

    const { addDoc } = require("firebase/firestore");
    expect(addDoc).toHaveBeenCalled();

    expect(Alert.alert).toHaveBeenCalledWith("Success", "Thread created.");
  });

  test("renders edit mode correctly and loads thread data", async () => {
    const mockThreadData = {
      title: "Existing Title",
      category: "Diet",
      content: "Existing content",
      mediaUrl: "https://mockurl.com/media.jpg",
      mediaType: "image",
    };

    const { getDoc } = require("firebase/firestore");
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockThreadData,
    });

    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "abc123",
    });

    const { getByText, getByPlaceholderText, queryByTestId } = render(
      <AddEditThread />
    );

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
  });

  test("calls updateDoc on submit for edited thread", async () => {
    const { getByText, getByPlaceholderText } = render(<AddEditThread />);

    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "abc123",
    });

    const { updateDoc } = require("firebase/firestore");

    fireEvent.changeText(getByPlaceholderText("Thread Title"), "Updated Title");
    fireEvent.changeText(
      getByPlaceholderText("Thread content..."),
      "Updated content"
    );

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

  test("renders media when image is set", async () => {
    const mockThreadData = {
      title: "Thread With Media",
      category: "Training",
      content: "Has media",
      mediaUrl: "https://mockurl.com/image.jpg",
      mediaType: "image",
    };

    const { getDoc } = require("firebase/firestore");
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockThreadData,
    });

    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "mediaThread",
    });

    const { getByTestId } = render(<AddEditThread />);

    await waitFor(() => {
      expect(getByTestId("thread-image")).toBeTruthy();
    });
  });

  test("uploads media and deletes old media if replaced on edit", async () => {
    const originalMediaUrl = "https://mockurl.com/oldmedia.jpg";

    const { useLocalSearchParams } = require("expo-router");
    useLocalSearchParams.mockReturnValue({ threadId: "abc123" });

    const {
      getDownloadURL,
      uploadBytes,
      deleteObject,
    } = require("firebase/storage");
    const { updateDoc, getDoc } = require("firebase/firestore");

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

    await waitFor(() =>
      expect(getByPlaceholderText("Thread Title").props.value).toBe("Old Title")
    );

    await act(async () => {
      fireEvent.press(getByText("Pick from Gallery"));
    });

    Alert.alert.mockImplementation((title, msg, buttons) => {
      const confirm = buttons?.find((b) => b.text === "Confirm");
      if (confirm) confirm.onPress();
    });

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(deleteObject).toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), "mockBlob");
    expect(getDownloadURL).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });

  test("deletes media when removed and updates thread", async () => {
    const originalMediaUrl = "https://mockurl.com/old.jpg";

    jest.spyOn(require("expo-router"), "useLocalSearchParams").mockReturnValue({
      threadId: "edit456",
    });

    const { getDoc } = require("firebase/firestore");
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        title: "With Media",
        category: "Cardio",
        content: "Something here",
        mediaUrl: originalMediaUrl,
        mediaType: "image",
      }),
    });

    const { getByText, getByPlaceholderText, getByTestId, queryByTestId } =
      render(<AddEditThread />);

    await waitFor(() =>
      expect(getByPlaceholderText("Thread Title").props.value).toBe(
        "With Media"
      )
    );

    expect(getByTestId("thread-image")).toBeTruthy();

    fireEvent.press(getByTestId("remove-media-button"));

    expect(queryByTestId("thread-image")).toBeNull();

    Alert.alert.mockImplementation((title, msg, buttons) => {
      if (Array.isArray(buttons)) {
        const confirm = buttons.find((b) => b.text === "Confirm");
        if (confirm && typeof confirm.onPress === "function") {
          confirm.onPress();
        }
      }
    });

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    const { deleteObject } = require("firebase/storage");
    expect(deleteObject).toHaveBeenCalled();
  });

  test("handleTakePhoto requests permission and handles photo and video capture", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
      status: "granted",
    });

    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "photo-uri", type: "image" }],
    });

    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "video-uri", type: "video" }],
    });

    Alert.alert.mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        if (buttons.find((b) => b.text === "Photo")) {
          buttons.find((b) => b.text === "Photo").onPress();
        } else if (buttons.find((b) => b.text === "Video")) {
          buttons.find((b) => b.text === "Video").onPress();
        }
      }
    });

    const { getByTestId } = render(<AddEditThread />);

    const takePhotoBtn = getByTestId("take-photo-button");

    await act(async () => {
      fireEvent.press(takePhotoBtn);
    });

    await act(async () => {
      fireEvent.press(takePhotoBtn);
    });
  });
});
