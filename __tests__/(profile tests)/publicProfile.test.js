// __tests__/PublicProfile.test.jsx
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import PublicProfile from "../../app/(profiles)/[userId]";

// Mock expo-router
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ userId: "testUserId" }),
}));

// Mock the entire firebaseConfig module (your db export)
jest.mock("../../firebaseConfig", () => ({
  db: {}, // empty object, no real Firebase instance needed
}));

// Mock firestore methods completely
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
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
  
describe("PublicProfile", () => {
  beforeEach(() => {
    mockDoc.mockClear();
    mockGetDoc.mockClear();
  });

  test("renders user profile after loading", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: "John Doe",
        bio: "Hello bio",
        profilePicUrl: "https://example.com/pic.jpg",
        height: 180,
        weight: 75,
        age: 30,
      }),
    });

    const { getByText, queryByTestId, getByTestId } = render(<PublicProfile />);

    expect(queryByTestId("loading-indicator")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("John Doe")).toBeTruthy();
    });

    fireEvent.press(getByTestId("profile-pic-button"));
    expect(getByTestId("profile-modal")).toBeTruthy();

    fireEvent.press(getByTestId("modal-overlay"));
    await waitFor(() => {
      expect(queryByTestId("profile-modal")).toBeNull();
    });
  });

  test("shows 'User not found' if no user document exists", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { getByText, queryByTestId } = render(<PublicProfile />);

    await waitFor(() => {
      expect(getByText("User not found")).toBeTruthy();
    });

    expect(queryByTestId("loading-indicator")).toBeNull();
  });
});
