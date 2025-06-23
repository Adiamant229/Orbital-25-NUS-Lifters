import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock firebaseConfig module to avoid loading Firebase SDK
jest.mock("../../firebaseConfig", () => ({
  auth: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate user not logged in by default
    callback(null);
    // Return a no-op unsubscribe function
    return () => {};
  }),

  signInWithEmailAndPassword: jest.fn((auth, email, password) => {
    // Simple mock logic:
    if (!email || !password) {
      return Promise.reject({
        code: "auth/invalid-email",
        message: "Invalid email",
      });
    }
    if (email === "test@example.com" && password === "password") {
      return Promise.resolve({ user: { uid: "test-uid" } });
    }
    return Promise.reject({
      code: "auth/user-not-found",
      message: "User not found",
    });
  }),
}));

// Mock expo-router's useRouter hook
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  Link: ({ children, href }) => {
    return <>{children}</>;
  },
}));

import Index from "../../app/index";

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("shows alert if email or password is empty", async () => {
    const { getByText } = render(<Index />);

    // Press login without filling inputs
    fireEvent.press(getByText("Login"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter both email and password"
    );
  });

  test("successful login calls Firebase and redirects", async () => {
    const { getByText, getByPlaceholderText } = render(<Index />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password");

    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gymCapacity");
    });
  });

  test("shows alert on invalid login", async () => {
    const { getByText, getByPlaceholderText } = render(<Index />);

    fireEvent.changeText(getByPlaceholderText("Email"), "wrong@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpassword");

    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Login Error",
        "Invalid email or password."
      );
    });
  });

  test("redirects immediately if user is already authenticated", async () => {
    const { onAuthStateChanged } = require("firebase/auth");

    // Mock before render to simulate logged-in user on initial mount
    onAuthStateChanged.mockImplementationOnce((auth, callback) => {
      callback({ uid: "test-uid" }); // simulate logged in user
      return () => {};
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gymCapacity");
    });
  });
  
});
