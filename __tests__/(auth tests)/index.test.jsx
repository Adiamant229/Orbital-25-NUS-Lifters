import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("../../firebaseConfig", () => ({
  auth: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),

  signInWithEmailAndPassword: jest.fn((auth, email, password) => {
    if (!email.includes("@")) {
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

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  Link: ({ children, href }) => {
    return <>{children}</>;
  },
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

import Index from "../../app/index";

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("shows alert if email or password is empty", async () => {
    const { getByText } = render(<Index />);

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter both email and password"
    );
  });

  test("shows alert on invalid login due to wrong password", async () => {
    const { getByText, getByPlaceholderText } = render(<Index />);

    fireEvent.changeText(getByPlaceholderText("Email"), "wrong@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpassword");

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Login Error",
        "Invalid email or password."
      );
    });
  });
  
  test("shows alert on invalid login due to invalid email format", async () => {
    const { getByText, getByPlaceholderText } = render(<Index />);

    fireEvent.changeText(getByPlaceholderText("Email"), "invalidEmailFormat");
    fireEvent.changeText(getByPlaceholderText("Password"), "somepassword");

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Login Error",
        "Please enter a valid email address."
      );
    });
  });
  

  test("successful login calls Firebase and redirects", async () => {
    const { getByText, getByPlaceholderText } = render(<Index />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password");

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gymCapacity");
    });
  });

  test("redirects immediately if user is already authenticated", async () => {
    const { onAuthStateChanged } = require("firebase/auth");
    onAuthStateChanged.mockImplementationOnce((auth, callback) => {
      callback({ uid: "test-uid" }); 
      return () => {};
    });

    render(<Index />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gymCapacity");
    });
  });
});
