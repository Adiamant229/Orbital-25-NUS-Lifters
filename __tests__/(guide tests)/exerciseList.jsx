import { render, waitFor, fireEvent } from "@testing-library/react-native";
import ExercisesList from "../../app/(exercises)/exercisesList"; 
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: "test-user-id",
      email: "user@example.com",
    },
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
  onAuthStateChanged: jest.fn((auth, callback) =>
    callback({
      uid: "test-user-id",
      email: "user@example.com",
    })
  ),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({ exists: () => true, data: () => ({}) })
  ),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock("../../firebaseConfig", () => ({
  __esModule: true,
  default: {},
  auth: {
    currentUser: {
      uid: "mock-user-123",
      email: "mockuser@example.com",
    },
  },
}));

describe("ExercisesList Component", () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: mockRouterPush });
  });

  test("renders exercises fetched from API and caches them", async () => {
    useLocalSearchParams.mockReturnValue({ mode: "bodyPart", query: "chest" });

    // Mock AsyncStorage returns no cache
    AsyncStorage.getItem.mockResolvedValue('{}');

    // Mock fetch response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            {
              id: "123",
              name: "push up",
              equipment: "body weight",
              description: "desc",
              bodyPart: "chest",
              secondaryMuscles: ["triceps"],
              instructions: ["step 1", "step 2"],
            },
          ]),
      })
    );

    const { getByText } = render(<ExercisesList />);

    await waitFor(() => {
      expect(getByText("Push Up")).toBeTruthy();
    });

    // Ensure AsyncStorage.setItem was called to cache results
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "bodyPart",
      expect.stringContaining('"chest"')
    );
  });

  test("loads exercises from cache if present", async () => {
    useLocalSearchParams.mockReturnValue({
      mode: "equipment",
      query: "dumbbell",
    });

    const cachedData = JSON.stringify({
      dumbbell: [
        {
          id: "999",
          name: "bicep curl",
          equipment: "dumbbell",
          description: "desc",
          bodyPart: "arms",
          secondaryMuscles: ["forearms"],
          instructions: ["step A", "step B"],
        },
      ],
    });

    AsyncStorage.getItem.mockResolvedValue(cachedData);

    // fetch should NOT be called if cache exists
    global.fetch = jest.fn();

    const { getByText } = render(<ExercisesList />);

    await waitFor(() => {
      expect(getByText("Bicep Curl")).toBeTruthy();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("navigates to exerciseDetails screen with correct params on button press", async () => {
    useLocalSearchParams.mockReturnValue({ mode: "bodyPart", query: "chest" });
    AsyncStorage.getItem.mockResolvedValue(null);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            {
              id: "123",
              name: "push up",
              equipment: "body weight",
              description: "desc",
              bodyPart: "chest",
              secondaryMuscles: ["triceps"],
              instructions: ["step 1", "step 2"],
            },
          ]),
      })
    );

    const { getByText } = render(<ExercisesList />);

    await waitFor(() => getByText("Push Up"));

    fireEvent.press(getByText("Push Up"));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/exerciseDetails",
      params: expect.objectContaining({
        name: "push up",
        id: "123",
        equipment: "body weight",
        description: "desc",
        bodyPart: "chest",
        secondaryMuscles: ["triceps"],
        instructions: encodeURIComponent(JSON.stringify(["step 1", "step 2"])),
      }),
    });
  });
});
