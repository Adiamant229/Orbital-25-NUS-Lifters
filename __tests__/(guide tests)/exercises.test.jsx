import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Exercises from "../../app/(guide)/exercises";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../app/index", () => ({
  capWords: (words) => words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)),
}));

process.env.EXPO_PUBLIC_EXERCISE_API_KEY = "fake-api-key";

global.fetch = jest.fn((url) => {
  if (url.includes("targetList")) {
    return Promise.resolve({
      json: () => Promise.resolve(["biceps", "triceps"]),
    });
  }
  if (url.includes("equipmentList")) {
    return Promise.resolve({
      json: () => Promise.resolve(["barbell", "dumbbell"]),
    });
  }
  if (url.includes("name")) {
    return Promise.resolve({
      json: () =>
        Promise.resolve([
          {
            id: "123",
            name: "bicep curl",
            equipment: "dumbbell",
            description: "curl the weight",
            bodyPart: "biceps",
            secondaryMuscles: ["forearms"],
            instructions: ["Hold dumbbells", "Curl up", "Lower down"],
          },
        ]),
    });
  }

  return Promise.resolve({
    json: () => Promise.resolve([]),
  });
});

describe("Exercises Screen", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly with title and input", async () => {
    const { getByText, getByPlaceholderText } = render(<Exercises />);
    await waitFor(() => {
      expect(getByText("Search your exercises all in one place!")).toBeTruthy();
      expect(getByPlaceholderText("Search Exercise")).toBeTruthy();
    });
  });

  test("performs search and renders results", async () => {
    const { getByPlaceholderText, findByText } = render(<Exercises />);
    const input = getByPlaceholderText("Search Exercise");

    fireEvent.changeText(input, "curl");

    const result = await findByText("Bicep Curl");
    expect(result).toBeTruthy();
  });

  test("navigates to exercise details on result press", async () => {
    const { getByPlaceholderText, findByText } = render(<Exercises />);
    const input = getByPlaceholderText("Search Exercise");

    fireEvent.changeText(input, "curl");

    const result = await findByText("Bicep Curl");
    fireEvent.press(result);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/exerciseDetails",
        params: expect.objectContaining({
          name: "bicep curl",
          id: "123",
        }),
      })
    );
  });
});
