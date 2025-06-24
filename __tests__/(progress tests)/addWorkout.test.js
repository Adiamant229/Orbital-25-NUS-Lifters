import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AddWorkout from "../../app/(progress)/addWorkout";
import { Alert } from "react-native";

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "testUser123" },
  },
  db: {},
}));

const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: (...args) => mockAddDoc(...args),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

describe("AddWorkout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders without crashing", () => {
    const { getByPlaceholderText } = render(<AddWorkout />);
    expect(getByPlaceholderText("Add in workout title")).toBeTruthy();
  });

  test("shows alert when submitting with empty workout title", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText } = render(<AddWorkout />);
    fireEvent.press(getByText("Submit"));
    expect(alertSpy).toHaveBeenCalledWith("Please enter a workout name.");
  });

  test("shows alert if workout time period not selected", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText, getByPlaceholderText } = render(<AddWorkout />);

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Workout"
    );

    fireEvent.press(getByText("Submit"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Please select a workout time period."
    );
  });

  test("shows alert if no exercises are added on submit", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText, getByPlaceholderText } = render(<AddWorkout />);

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Workout"
    );

    fireEvent.press(getByText("Select Time Period:"));
    await waitFor(() => fireEvent.press(getByText("Morning")));
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Please add at least one exercise.");
    });
  });

  test("shows alert if no sets were added to an exercise", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AddWorkout />
    );

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Workout"
    );

    fireEvent.press(getByText("Select Time Period:"));
    await waitFor(() => fireEvent.press(getByText("Morning")));

    fireEvent.press(getByText("+ Add Exercise"));

    const exerciseDropdowns = getAllByText("Select exercise");
    fireEvent.press(exerciseDropdowns[0]);
    await waitFor(() => fireEvent.press(getByText("Bench Press")));

    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Please add at least one set to each exercise."
      );
    });
  });

  test("shows alert if no reps or weights are added in the set on submit", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AddWorkout />
    );

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Workout"
    );

    fireEvent.press(getByText("Select Time Period:"));
    await waitFor(() => fireEvent.press(getByText("Morning")));
    fireEvent.press(getByText("+ Add Exercise"));

    const exerciseDropdowns = getAllByText("Select exercise");
    fireEvent.press(exerciseDropdowns[0]);
    await waitFor(() => fireEvent.press(getByText("Bench Press")));

    fireEvent.press(getByText("+ Add Set"));
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Please fill in reps and weight for all sets."
      );
    });
  });

  test("selects different time periods", async () => {
    const { getByText } = render(<AddWorkout />);
    const dropdownTrigger = getByText("Select Time Period:");

    fireEvent.press(dropdownTrigger);
    await waitFor(() => {
      fireEvent.press(getByText("Afternoon"));
      expect(getByText("Afternoon")).toBeTruthy();
    });

    fireEvent.press(dropdownTrigger);
    await waitFor(() => {
      fireEvent.press(getByText("Night"));
      expect(getByText("Night")).toBeTruthy();
    });
  });

  test("adds exercise and updates its name", () => {
    const { getByText, queryAllByText } = render(<AddWorkout />);
    fireEvent.press(getByText("+ Add Exercise"));
    expect(queryAllByText(/Exercise \d+/)).toHaveLength(1);
  });

  test("adds a set to the exercise", async () => {
    const { getByText, queryAllByText } = render(<AddWorkout />);
    fireEvent.press(getByText("+ Add Exercise"));
    fireEvent.press(getByText("+ Add Set"));
    await waitFor(() => {
      expect(queryAllByText(/Set \d+/)).toHaveLength(1);
    });
  });

  test("updates reps and weight dropdown selections", async () => {
    const { getByText } = render(<AddWorkout />);
    fireEvent.press(getByText("+ Add Exercise"));
    fireEvent.press(getByText("+ Add Set"));

    fireEvent.press(getByText("Reps"));
    await waitFor(() => fireEvent.press(getByText("8 reps")));

    fireEvent.press(getByText("Weight (kg)"));
    await waitFor(() => fireEvent.press(getByText("40.0 kg")));

    expect(getByText("8 reps")).toBeTruthy();
    expect(getByText("40.0 kg")).toBeTruthy();
  });

test("removes exercise when delete button is pressed", () => {
  const { getByText, queryByText, getByTestId } = render(<AddWorkout />);
  fireEvent.press(getByText("+ Add Exercise"));
  expect(getByText("Exercise 1")).toBeTruthy();

  fireEvent.press(getByTestId("delete-exercise-btn-1"));

  expect(queryByText("Exercise 1")).toBeNull();
});

  test("submits successfully with valid data and confirms submission", async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AddWorkout />
    );
    const alertSpy = jest.spyOn(Alert, "alert");

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Leg Day"
    );

    fireEvent.press(getByText("Select Time Period:"));
    await waitFor(() => {
      fireEvent.press(getByText("Morning"));
    });

    fireEvent.press(getByText("+ Add Exercise"));

    const exerciseDropdowns = getAllByText("Select exercise");
    fireEvent.press(exerciseDropdowns[0]);
    await waitFor(() => fireEvent.press(getByText("Bench Press")));

    fireEvent.press(getByText("+ Add Set"));

    fireEvent.press(getByText("Reps"));
    await waitFor(() => {
      fireEvent.press(getByText("10 reps"));
    });

    fireEvent.press(getByText("Weight (kg)"));
    await waitFor(() => {
      fireEvent.press(getByText("50.0 kg"));
    });

    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Save Workout",
        "Are you sure you want to save this workout?",
        expect.any(Array)
      );
    });
  });

  test("does not submit workout if submission confirmation is cancelled", async () => {
    const alertMock = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        if (Array.isArray(buttons)) {
          const cancelBtn = buttons.find((b) => b.style === "cancel");
          if (cancelBtn?.onPress) cancelBtn.onPress();
        }
      });

    const { getByText, getByPlaceholderText, getByTestId, getAllByText } =
      render(<AddWorkout />);

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Workout"
    );

    fireEvent.press(getByText("+ Add Exercise"));

    fireEvent.press(getByText("Select exercise"));
    await waitFor(() => fireEvent.press(getByText("Bench Press")));

    fireEvent.press(getByText("+ Add Set"));

    fireEvent.press(getByText("Reps"));
    await waitFor(() => fireEvent.press(getByText("10 reps")));

    fireEvent.press(getByText("Weight (kg)"));
    await waitFor(() => fireEvent.press(getByText("20.0 kg")));

    fireEvent.press(getByText("Select Time Period:"));
    await waitFor(() => fireEvent.press(getByText("Morning")));

    fireEvent.press(getByText("Submit"));

    expect(mockAddDoc).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  test("calls addDoc on confirmation of workout submission", async () => {
    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const confirmBtn = buttons.find(
        (btn) => btn.text === "Save" || btn.text === "Update"
      );
      if (confirmBtn && confirmBtn.onPress) {
        confirmBtn.onPress();
      }
    });

    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AddWorkout />
    );

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Leg Day"
    );

    fireEvent.press(getByText("Select Time Period:"));
    await waitFor(() => fireEvent.press(getByText("Morning")));

    fireEvent.press(getByText("+ Add Exercise"));

    fireEvent.press(getAllByText("Select exercise")[0]);
    await waitFor(() => fireEvent.press(getByText("Bench Press")));

    fireEvent.press(getByText("+ Add Set"));

    fireEvent.press(getByText("Reps"));
    await waitFor(() => fireEvent.press(getByText("10 reps")));

    fireEvent.press(getByText("Weight (kg)"));
    await waitFor(() => fireEvent.press(getByText("50.0 kg")));

    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });
  });
});
