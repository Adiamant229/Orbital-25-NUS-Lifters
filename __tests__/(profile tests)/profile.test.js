import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import Profile from "../../app/(dashboard)/profile";

const mockSignOut = jest.fn();
const mockReplace = jest.fn();
const mockOnSnapshot = jest.fn();

jest.mock("../../firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "test-uid" },
  },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  onSnapshot: (...args) => mockOnSnapshot(...args),
}));

jest.mock("firebase/auth", () => ({
  signOut: (...args) => mockSignOut(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
  }),
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

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("displays user data from Firestore snapshot", async () => {
    const snapshotMock = {
      exists: () => true,
      data: () => ({
        name: "Snapshot User",
        bio: "Test bio",
        height: 180,
        weight: 75,
        age: 25,
      }),
    };

    mockOnSnapshot.mockImplementation((docRef, onSuccess, onError) => {
      onSuccess(snapshotMock);
      return jest.fn(); 
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText("Snapshot User")).toBeTruthy();
      expect(getByText("Bio")).toBeTruthy();
      expect(getByText("Height: 180 cm")).toBeTruthy();
      expect(getByText("Weight: 75 kg")).toBeTruthy();
      expect(getByText("Age: 25")).toBeTruthy();
    });
  });

  test("displays 'No user data' if snapshot does not exist", async () => {
    const snapshotMock = {
      exists: () => false,
    };

    mockOnSnapshot.mockImplementation((docRef, onSuccess, onError) => {
      onSuccess(snapshotMock);
      return jest.fn();
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText("No user data")).toBeTruthy();
    });
  });

  test("shows error if snapshot fails", async () => {
    mockOnSnapshot.mockImplementation((docRef, onSuccess, onError) => {
      onError(new Error("Firestore error"));
      return jest.fn();
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText("Error loading data")).toBeTruthy();
    });
  });

  test("logout flow calls signOut and redirects", async () => {
    mockOnSnapshot.mockImplementation((docRef, onSuccess) => {
      onSuccess({
        exists: () => true,
        data: () => ({ name: "Test User" }),
      });
      return jest.fn();
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => getByText("Test User"));

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const logoutButton = buttons.find((btn) => btn.text === "Logout");
      logoutButton.onPress();
    });

    fireEvent.press(getByText("Logout"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  test("logout failure shows error alert", async () => {
    mockOnSnapshot.mockImplementation((docRef, onSuccess) => {
      onSuccess({
        exists: () => true,
        data: () => ({ name: "Test User" }),
      });
      return jest.fn();
    });

    mockSignOut.mockRejectedValueOnce(new Error("Logout failed"));

    const { getByText } = render(<Profile />);
    await waitFor(() => getByText("Test User"));

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const logoutButton = buttons.find((btn) => btn.text === "Logout");
      logoutButton.onPress();
    });

    fireEvent.press(getByText("Logout"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to logout.");
    });
  });

  test("modal opens and closes on profile picture press", async () => {
    mockOnSnapshot.mockImplementation((docRef, onSuccess) => {
      onSuccess({
        exists: () => true,
        data: () => ({
          name: "Modal Tester",
          profilePicUrl: "https://example.com/pic.jpg",
        }),
      });
      return jest.fn();
    });

    const { getByTestId, queryByTestId } = render(<Profile />);

    await waitFor(() => getByTestId("avatar-icon"));

    expect(queryByTestId("profile-modal")).toBeNull();

    fireEvent.press(getByTestId("avatar-icon"));
    expect(getByTestId("profile-modal")).toBeTruthy();
    
    fireEvent.press(getByTestId("modal-overlay"));
    await waitFor(() => {
      expect(queryByTestId("profile-modal")).toBeNull();
    });
  });
  
});
