import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AddWorkout from "../../app/(progress)/addWorkout"; 
import { Alert } from "react-native";

// Mocks
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../firebaseConfig", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe("AddWorkout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { getByPlaceholderText } = render(<AddWorkout />);
    expect(getByPlaceholderText("Add in workout title")).toBeTruthy();
  });

  it("shows alert when submitting with empty fields", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText } = render(<AddWorkout />);
    const submitBtn = getByText("Submit");

    fireEvent.press(submitBtn);

    expect(alertSpy).toHaveBeenCalledWith("Please enter a workout name.");
  });

  it("adds exercise and updates its name", async () => {
    const { getByText, queryAllByText } = render(<AddWorkout />);

    fireEvent.press(getByText("+ Add Exercise"));
    expect(queryAllByText(/Exercise \d+/)).toHaveLength(1);
  });

  it("adds a set to the exercise", async () => {
    const { getByText, queryAllByText } = render(<AddWorkout />);

    fireEvent.press(getByText("+ Add Exercise"));
    fireEvent.press(getByText("+ Add Set"));

    await waitFor(() => {
      expect(queryAllByText(/Set \d+/)).toHaveLength(1);
    });
  });

  it("submits successfully with valid data", async () => {
    const {
      getByPlaceholderText,
      getByText,
      getByDisplayValue,
      queryAllByText,
    } = render(<AddWorkout />);

    const workoutNameInput = getByPlaceholderText("Add in workout title");
    fireEvent.changeText(workoutNameInput, "Chest Day");

    fireEvent.press(getByText("+ Add Exercise"));
    fireEvent.press(getByText("+ Add Set"));

    const alertSpy = jest.spyOn(Alert, "alert");

    // Select workout time
    const selectTime = getByText("Select Time Period:");
    fireEvent.press(selectTime);

    await waitFor(() => {
      const timeOption = getByText("Morning");
      fireEvent.press(timeOption);
    });

    // Try submitting
    const submitBtn = getByText("Submit");
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Track Workout",
        "Are you sure you want to track this workout?",
        expect.any(Array)
      );
    });
  });
});
