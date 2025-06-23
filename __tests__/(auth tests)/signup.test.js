import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

const mockReplace = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    Link: ({ children, href }) =>
      React.createElement(
        "Text",
        { onPress: () => mockReplace(href) },
        children
      ),
    useRouter: () => ({
      replace: mockReplace,
    }),
  };
});

jest.mock("../../firebaseConfig", () => ({
  auth: {},
  db: {},
}));

const mockCreateUserWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({ user: { uid: "test-uid" } })
);
const mockUpdateProfile = jest.fn(() => Promise.resolve());

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args) =>
    mockCreateUserWithEmailAndPassword(...args),
  updateProfile: (...args) => mockUpdateProfile(...args),
}));

const mockDoc = jest.fn(() => ({}));
const mockSetDoc = jest.fn(() => Promise.resolve());

jest.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
}));

import Signup from "../../app/(auth)/signup";

jest.spyOn(Alert, "alert");

describe("Signup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows alert if username is empty", async () => {
    const { getByText } = render(<Signup />);
    fireEvent.press(getByText("Create"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter your username."
      )
    );
  });

  test("shows alert if email or password is empty", async () => {
    const { getByPlaceholderText, getByText } = render(<Signup />);
    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.press(getByText("Create"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter both email and password."
      )
    );
  });

  test("shows alert if passwords do not match", async () => {
    const { getByPlaceholderText, getByText } = render(<Signup />);
    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "different123"
    );
    fireEvent.press(getByText("Create"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Passwords do not match."
      )
    );
  });

  test("successful signup calls Firebase methods and shows success alert", async () => {
    const { getByPlaceholderText, getByText } = render(<Signup />);
    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "password123"
    );

    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        { uid: "test-uid" },
        { displayName: "testuser" }
      );
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        "test-uid"
      );
      expect(mockSetDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Account created!");
    });
  });

  test("handles Firebase signup error correctly", async () => {
    const error = { code: "auth/email-already-in-use" };
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

    const { getByPlaceholderText, getByText } = render(<Signup />);
    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "password123"
    );

    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign Up Failed",
        "This email address is already in use."
      );
    });
  });

  test("handles unknown Firebase error gracefully", async () => {
    const error = { code: "some-unknown-error" };
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

    const { getByPlaceholderText, getByText } = render(<Signup />);
    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "password123"
    );

    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign Up Failed",
        "An error occurred during sign up."
      );
    });
  });

  test("clicking 'Login instead' redirects to the home page", async () => {
    const { getByText } = render(<Signup />);
    fireEvent.press(getByText("Login instead"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
