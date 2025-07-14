import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import EditProfile from "../../app/(profiles)/editProfile";

const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockRef = jest.fn();
const mockRouterBack = jest.fn();

jest.mock("../../firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "test-uid" },
  },
  db: {},
  storage: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

jest.mock("firebase/storage", () => ({
  ref: (...args) => mockRef(...args),
  uploadBytes: (...args) => mockUploadBytes(...args),
  getDownloadURL: (...args) => mockGetDownloadURL(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockRouterBack,
  }),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "library-uri" }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "camera-uri" }],
    })
  ),
  Images: "Images",
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
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(["test"])),
  })
);

describe("EditProfile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("loads user data on mount", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: "John Doe",
        bio: "Athlete",
        height: 180,
        weight: 75,
        age: 22,
        profilePicUrl: "http://pic.url",
      }),
    });

    const { getByDisplayValue } = render(<EditProfile />);

    await waitFor(() => {
      expect(getByDisplayValue("John Doe")).toBeTruthy();
      expect(getByDisplayValue("Athlete")).toBeTruthy();
      expect(getByDisplayValue("180")).toBeTruthy();
      expect(getByDisplayValue("75")).toBeTruthy();
      expect(getByDisplayValue("22")).toBeTruthy();
    });
  });

  test("shows alert on empty name when saving", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: "",
        bio: "",
        height: null,
        weight: null,
        age: null,
      }),
    });

    const { getByText } = render(<EditProfile />);
    await waitFor(() => getByText("Save"));

    fireEvent.press(getByText("Save"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Validation Error",
      "Name cannot be empty."
    );
  });

  test("validates height as number", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test", height: "abc" }),
    });

    const { getByText, getByPlaceholderText } = render(<EditProfile />);
    await waitFor(() => getByText("Save"));

    fireEvent.changeText(getByPlaceholderText("Height (cm)"), "abc");
    fireEvent.press(getByText("Save"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Validation Error",
      "Height must be a number."
    );
  });

  test("successful save updates Firestore", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Old Name" }),
    });
    mockUpdateDoc.mockResolvedValueOnce();

    const { getByText, getByPlaceholderText } = render(<EditProfile />);
    await waitFor(() => getByText("Save"));

    fireEvent.changeText(getByPlaceholderText("Enter your name"), "New Name");

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const saveButton = buttons.find((b) => b.text === "Save");
      saveButton.onPress();
    });

    fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  test("pressing cancel calls router.back after confirmation", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });

    const { getByText } = render(<EditProfile />);
    await waitFor(() => getByText("Cancel"));

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const yesButton = buttons.find((b) => b.text === "Yes");
      yesButton.onPress();
    });

    fireEvent.press(getByText("Cancel"));

    expect(mockRouterBack).toHaveBeenCalled();
  });

  test("modal shows upload options when triggered", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });

    const { getByTestId, getByText, getAllByText } = render(<EditProfile />);
    await waitFor(() => getByTestId("uploadPhotoButton"));

    fireEvent.press(getByTestId("uploadPhotoButton"));

    await waitFor(() => {
      expect(getByText("Choose from Library")).toBeTruthy();
      expect(getByText("Take Photo")).toBeTruthy();
      expect(getAllByText("Cancel").length).toBeGreaterThan(0);
    });
  });

  test("picks image from library and uploads", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });
    mockUploadBytes.mockResolvedValueOnce();
    mockGetDownloadURL.mockResolvedValueOnce("http://uploaded.url");

    const { getByTestId, getByText } = render(<EditProfile />);
    await waitFor(() => getByTestId("uploadPhotoButton"));

    fireEvent.press(getByTestId("uploadPhotoButton"));
    await waitFor(() => fireEvent.press(getByText("Choose from Library")));

    await waitFor(() => {
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
    });
  });

  test("shows alert if getDoc fails", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Failed to load"));

    render(<EditProfile />);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Could not load profile data."
      );
    });
  });

  test("shows alert if updateDoc fails", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Old" }),
    });
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));

    const { getByText, getByPlaceholderText } = render(<EditProfile />);
    await waitFor(() => getByText("Save"));

    fireEvent.changeText(
      getByPlaceholderText("Enter your name"),
      "Changed Name"
    );

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const saveButton = buttons.find((b) => b.text === "Save");
      saveButton.onPress();
    });

    fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to save profile."
      );
    });
  });

  test("shows alert if uploadImageAsync called without user", async () => {
    const { auth } = require("../../firebaseConfig");
    auth.currentUser = null;

    const { getByTestId, getByText } = render(<EditProfile />);
    await waitFor(() => getByTestId("uploadPhotoButton"));

    fireEvent.press(getByTestId("uploadPhotoButton"));
    await waitFor(() => fireEvent.press(getByText("Choose from Library")));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Upload Error",
        "Failed to upload profile picture."
      );
    });
  });

  test("shows alert if media permission denied for library", async () => {
    const {
      requestMediaLibraryPermissionsAsync,
    } = require("expo-image-picker");
    requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      granted: false,
    });

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });

    const { getByTestId, getByText } = render(<EditProfile />);
    await waitFor(() => getByTestId("uploadPhotoButton"));

    fireEvent.press(getByTestId("uploadPhotoButton"));
    await waitFor(() => fireEvent.press(getByText("Choose from Library")));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Permission denied",
      "Allow access to photos."
    );
  });

  test("shows alert if camera permission denied", async () => {
    const { requestCameraPermissionsAsync } = require("expo-image-picker");
    requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });

    const { getByTestId, getByText } = render(<EditProfile />);
    await waitFor(() => getByTestId("uploadPhotoButton"));

    fireEvent.press(getByTestId("uploadPhotoButton"));
    await waitFor(() => fireEvent.press(getByText("Take Photo")));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Permission denied",
      "Allow access to camera."
    );
  });

  test("takePhoto uploads taken image and sets profile pic URL", async () => {
    const { auth } = require("../../firebaseConfig");
    auth.currentUser = { uid: "test-uid" };

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: "Test",
        profilePicUrl: null,
      }),
    });

    mockUploadBytes.mockResolvedValueOnce();
    mockGetDownloadURL.mockResolvedValueOnce("http://camera-uploaded.url");

    const { getByTestId, getByText } = render(<EditProfile />);

    await waitFor(() => getByText("Save"));

    fireEvent.press(getByTestId("uploadPhotoButton"));

    await waitFor(() => getByText("Take Photo"));

    fireEvent.press(getByText("Take Photo"));

    await waitFor(() => {
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
    });
  });
  test("validates weight as number", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });

    const { getByText, getByPlaceholderText } = render(<EditProfile />);
    await waitFor(() => getByText("Save"));

    fireEvent.changeText(getByPlaceholderText("Enter your name"), "abc");
    fireEvent.changeText(getByPlaceholderText("Weight (kg)"), "abc");
    fireEvent.press(getByText("Save"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Validation Error",
      "Weight must be a number."
    );
  });

  test("validates age as number", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test" }),
    });

    const { getByText, getByPlaceholderText } = render(<EditProfile />);
    await waitFor(() => getByText("Save"));

    fireEvent.changeText(getByPlaceholderText("Enter your name"), "abc");
    fireEvent.changeText(getByPlaceholderText("Age (years)"), "xyz");
    fireEvent.press(getByText("Save"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Validation Error",
      "Age must be a number."
    );
  });
});
