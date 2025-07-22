import { render } from "@testing-library/react-native";
import ExerciseDetails from "../../app/(exercises)/exerciseDetails";
import { useLocalSearchParams } from "expo-router";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
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

jest.mock("expo-image", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return {
    Image: ({ source }) => (
      <View testID="mocked-expo-image">
        <Text>Mocked Image: {source.uri}</Text>
      </View>
    ),
  };
});

describe("ExerciseDetails Screen", () => {
  const mockParams = {
    name: "push up",
    id: "1234",
    description: "A basic push-up exercise.",
    equipment: "body weight",
    bodyPart: "chest",
    secondaryMuscles: "triceps,shoulders",
    instructions: encodeURIComponent(
      JSON.stringify([
        "Start in a high plank position",
        "Lower your body until your chest nearly touches the floor",
        "Push yourself back up to the starting position",
      ])
    ),
  };

  beforeEach(() => {
    useLocalSearchParams.mockReturnValue(mockParams);
  });

  test("renders exercise details correctly", () => {
    const { getByText } = render(<ExerciseDetails />);

    expect(getByText("Push Up")).toBeTruthy();
    expect(getByText("Description: A basic push-up exercise.")).toBeTruthy();
    expect(getByText(" Equipment: Body weight")).toBeTruthy();
    expect(getByText(" Primary Muscles: Chest")).toBeTruthy();
    expect(getByText(" Secondary Muscles: Triceps, Shoulders")).toBeTruthy();
    expect(getByText(" Instructions:")).toBeTruthy();

    expect(getByText("1: Start in a high plank position")).toBeTruthy();
    expect(
      getByText("2: Lower your body until your chest nearly touches the floor")
    ).toBeTruthy();
    expect(
      getByText("3: Push yourself back up to the starting position")
    ).toBeTruthy();
  });

  test("displays the image with correct URL", () => {
    const { getByTestId, getByText } = render(<ExerciseDetails />);
    const mockedImage = getByTestId("mocked-expo-image");
    expect(mockedImage).toBeTruthy();
    expect(getByText(/exerciseId=1234/)).toBeTruthy();
  });
});
