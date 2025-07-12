import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ThreadDetailPage from "../../app/(forum)/[threadId]";

// Mocks: AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mocks: Themed Context
jest.mock("../../components/themedContext", () => ({
  useThemeContext: () => ({ theme: "light", setTheme: jest.fn() }),
}));

// Mocks: Expo Router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ threadId: "testThreadId" }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mocks: Firebase Config
jest.mock("../../firebaseConfig", () => ({
  db: {},
}));

// Mocks: Firebase Auth
const mockCurrentUser = { uid: "user123" };
jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: mockCurrentUser,
  }),
}));

// Mocks: Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockUpdateDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn((...args) => args.join("/"));
const mockCollection = jest.fn((...args) => args.join("/"));

jest.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
}));

// Mock: Video from expo-av
jest.mock("expo-av", () => ({
  Video: ({ ...props }) => {
    return <></>;
  },
}));

describe("ThreadDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders thread with author as current user and comment by John Doe", async () => {
    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Test Thread",
            content: "Test content goes here",
            authorId: "user123", // current user as author
            category: "General",
            createdAt: { toDate: () => new Date("2024-01-01") },
            likes: 3,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({
          docs: [
            {
              id: "comment1",
              data: () => ({
                commenterID: "otherUserId", // different user as commenter
                content: "Test comment",
                createdAt: { toMillis: () => 1000, toDate: () => new Date() },
                editedAt: null,
                likes: 2,
                likedBy: [],
              }),
            },
          ],
        });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({
              id: "user123",
              data: () => ({ name: "Current User" }),
            });
            cb({
              id: "otherUserId",
              data: () => ({ name: "John Doe" }),
            });
          },
        });
      }
      return jest.fn(); // unsubscribe function
    });

    const { getByText } = render(<ThreadDetailPage />);

    await waitFor(() => {
      expect(getByText("Test Thread")).toBeTruthy();
      expect(getByText("Test content goes here")).toBeTruthy();
      expect(getByText("- Test comment")).toBeTruthy();
      expect(getByText("You")).toBeTruthy();
      expect(getByText("John Doe")).toBeTruthy();
    });
  });


  
});
