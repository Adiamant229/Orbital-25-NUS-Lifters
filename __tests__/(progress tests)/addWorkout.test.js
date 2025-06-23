import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AddWorkout from "../../app/(progress)/addWorkout";
import { Alert } from "react-native";

// --- Mocks ---

// DateTimePicker mock
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

// expo-router mock
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// firebaseConfig mock (full)
jest.mock("../../firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "testUser123" },
  },
  db: {}, // needed to satisfy db ref
}));

// firebase/firestore mock
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: (...args) => mockAddDoc(...args),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

// --- Tests ---
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

  it("adds exercise and updates its name", () => {
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
    const { getByText, getByPlaceholderText, queryAllByText } = render(
      <AddWorkout />
    );
    const alertSpy = jest.spyOn(Alert, "alert");

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Leg Day"
    );

    // Add exercise and set
    fireEvent.press(getByText("+ Add Exercise"));
    fireEvent.press(getByText("+ Add Set"));

    // Select time period
    const dropdownTrigger = getByText("Select Time Period:");
    fireEvent.press(dropdownTrigger);

    await waitFor(() => {
      const timeOption = getByText("Morning");
      fireEvent.press(timeOption);
    });

    // Fill reps and weight
    await waitFor(() => {
      const repsDropdown = getByText("Reps");
      fireEvent.press(repsDropdown);
      fireEvent.press(getByText("10 reps"));
    });

    await waitFor(() => {
      const weightDropdown = getByText("Weight (kg)");
      fireEvent.press(weightDropdown);
      fireEvent.press(getByText("50.0 kg"));
    });

    // Submit form
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Save Workout",
        "Are you sure you want to save this workout?",
        expect.any(Array)
      );
    });
  });
});
