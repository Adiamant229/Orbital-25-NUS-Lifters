import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("../../firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "test-uid" },
  },
  db: {},
}));

const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockSignOut = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

jest.mock("firebase/auth", () => ({
  signOut: (...args) => mockSignOut(...args),
}));

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

import Profile from "../../app/(dashboard)/profile";

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("loads and displays username from Firestore", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test User" }),
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText("Test User")).toBeTruthy();
    });
  });

  test("shows 'No user data' if doc does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText("No user data")).toBeTruthy();
    });
  });

  test("shows 'Error' if fetching data fails", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Firestore error"));

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText("Error")).toBeTruthy();
    });
  });

  test("entering edit mode shows input and buttons", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test User" }),
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Profile />
    );

    await waitFor(() => getByText("Test User"));

    fireEvent.press(getByTestId("editButton"));

    expect(getByPlaceholderText("Enter new name")).toBeTruthy();
  });

  test("cancel editing resets input and exits edit mode", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test User" }),
    });

    const {
      getByText,
      getByPlaceholderText,
      getByTestId,
      queryByPlaceholderText,
    } = render(<Profile />);
    await waitFor(() => getByText("Test User"));

    fireEvent.press(getByTestId("editButton"));

    const input = getByPlaceholderText("Enter new name");
    fireEvent.changeText(input, "New Name");

    fireEvent.press(getByTestId("cancelButton"));

    // After cancel, input should be gone (not in edit mode)
    expect(queryByPlaceholderText("Enter new name")).toBeNull();

    // Username text should revert to original
    expect(getByText("Test User")).toBeTruthy();
  });

  test("shows alert if save with empty input", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test User" }),
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Profile />
    );
    await waitFor(() => getByText("Test User"));

    fireEvent.press(getByTestId("editButton"));
    const input = getByPlaceholderText("Enter new name");
    fireEvent.changeText(input, "   "); // empty after trim

    fireEvent.press(getByTestId("saveButton"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter a new name."
    );
  });

  test("save successfully updates username and exits edit mode", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Old Name" }),
    });
    mockUpdateDoc.mockResolvedValueOnce();

    const { getByText, getByPlaceholderText, getByTestId, queryByText } =
      render(<Profile />);
    await waitFor(() => getByText("Old Name"));

    fireEvent.press(getByTestId("editButton"));
    const input = getByPlaceholderText("Enter new name");
    fireEvent.changeText(input, "New Name");

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const saveButton = buttons.find((btn) => btn.text === "Save");
      saveButton.onPress();
    });

    fireEvent.press(getByTestId("saveButton"));

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
        name: "New Name",
      });
      expect(queryByText("New Name")).toBeTruthy();
    });
  });

  test("save failure shows error alert", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Old Name" }),
    });
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Profile />
    );
    await waitFor(() => getByText("Old Name"));

    fireEvent.press(getByTestId("editButton"));
    const input = getByPlaceholderText("Enter new name");
    fireEvent.changeText(input, "New Name");

    Alert.alert.mockImplementationOnce((title, msg, buttons) => {
      const saveButton = buttons.find((btn) => btn.text === "Save");
      saveButton.onPress();
    });

    fireEvent.press(getByTestId("saveButton"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to save your name. Please try again."
      );
    });
  });

  test("logout flow calls signOut and redirects", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test User" }),
    });
    mockSignOut.mockResolvedValueOnce();

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
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: "Test User" }),
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
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to logout. Please try again."
      );
    });
  });
});
