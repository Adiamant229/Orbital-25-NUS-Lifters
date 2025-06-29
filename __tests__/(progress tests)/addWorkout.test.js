import * as ExpoRouter from "expo-router";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AddWorkout from "../../app/(progress)/addWorkout";
import { Alert } from "react-native";

let mockBack;

jest.mock("expo-router", () => {
  mockBack = jest.fn();

  return {
    useRouter: () => ({
      back: mockBack,
    }),
    useLocalSearchParams: jest.fn(() => ({})),
  };
});

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("../../firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "testUser123" },
  },
  db: {},
}));

const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: (...args) => mockAddDoc(...args),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

// Mock data for edit workout fetch
const mockWorkoutData = {
  exists: () => true,
  data: () => ({
    name: "Original Workout",
    workoutNotes: "Original notes",
    exercises: [
      {
        id: 1,
        name: "Bench Press",
        sets: [{ id: 1, reps: "10", weight: "50" }],
      },
    ],
    timePeriod: "Morning",
    createdAt: { toDate: () => new Date("2023-01-01T00:00:00Z") },
  }),
};
describe("AddWorkout Component", () => {
  beforeEach(() => {
    ExpoRouter.useLocalSearchParams.mockImplementation(() => ({}));
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
      expect(alertSpy).toHaveBeenCalledWith(
        "Please add at least one exercise."
      );
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

  test("alerts when cancelling a new workout with changes", async () => {
    const alertMock = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        if (Array.isArray(buttons)) {
          const cancelBtn = buttons.find((b) => b.style === "cancel");
          if (cancelBtn?.onPress) cancelBtn.onPress();
        }
      });

    const { getByText, getByPlaceholderText } = render(<AddWorkout />);

    fireEvent.changeText(
      getByPlaceholderText("Add in workout title"),
      "Workout"
    );

    fireEvent.press(getByText("+ Add Exercise"));

    fireEvent.press(getByText("Cancel"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Cancel New Workout?",
      "You have started creating a new workout. Are you sure you want to cancel?",
      expect.any(Array)
    );
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

    const { getByText, getByPlaceholderText } = render(<AddWorkout />);

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

  describe("editing existing workout", () => {
    beforeEach(() => {
      ExpoRouter.useLocalSearchParams.mockImplementation(() => ({
        editWorkoutId: "workout123",
      }));
      mockGetDoc.mockResolvedValueOnce(mockWorkoutData);
      mockDoc.mockReturnValue({});
      jest.clearAllMocks();
    });

    test("loads existing workout and updates on submit", async () => {
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          const confirmBtn = buttons.find((btn) => btn.text === "Update");
          if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
        });

      const { getByPlaceholderText, getByText } = render(<AddWorkout />);

      await waitFor(() => {
        expect(getByPlaceholderText("Add in workout title").props.value).toBe(
          "Original Workout"
        );
      });

      fireEvent.changeText(
        getByPlaceholderText("Add in workout title"),
        "Updated Workout"
      );

      fireEvent.press(getByText("Save"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Update Workout",
          "Are you sure you want to update this workout?",
          expect.any(Array)
        );
        expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

        const updateArg = mockUpdateDoc.mock.calls[0][1];
        expect(updateArg.name).toBe("Updated Workout");
      });

      alertSpy.mockRestore();
    });

    test("loads existing workout and updates on submit", async () => {
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          const confirmBtn = buttons.find((btn) => btn.text === "Update");
          if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
        });

      const { getByPlaceholderText, getByText } = render(<AddWorkout />);

      await waitFor(() => {
        expect(getByPlaceholderText("Add in workout title").props.value).toBe(
          "Original Workout"
        );
      });

      fireEvent.changeText(
        getByPlaceholderText("Add in workout title"),
        "Updated Workout"
      );

      fireEvent.press(getByText("Cancel"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        expect.any(Array)
      );
    });
  });

  test("updates the workout date when a new date is selected", async () => {
    const { getByTestId, getByText } = render(<AddWorkout />);

    fireEvent.press(getByTestId("open-date-picker-btn"));

    const newSelectedDate = new Date("2024-12-25");

    act(() => {
      const picker = getByTestId("date-picker");
      picker.props.onChange({}, newSelectedDate);
    });

    expect(getByText(/25\/12\/2024|12\/25\/2024/)).toBeTruthy();
  });
  // NEW TEST: Error handling for workout fetch failure
  describe("error handling when fetching workout", () => {
    beforeEach(() => {
      // Mock the param to simulate edit mode with invalid workout id
      ExpoRouter.useLocalSearchParams.mockImplementation(() => ({
        editWorkoutId: "invalidWorkoutId",
      }));

      // Reset mocks for getDoc and doc
      mockGetDoc.mockReset();
      mockDoc.mockReset();
    });

    test("alerts on fetch error", async () => {
      // Arrange: getDoc throws error
      mockGetDoc.mockRejectedValueOnce(new Error("Firestore fetch failed"));

      // Spy on Alert.alert and mock router.back
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
      const routerBackSpy = jest
        .spyOn(ExpoRouter.useRouter(), "back")
        .mockImplementation(jest.fn());

      // Act: render triggers useEffect
      render(<AddWorkout />);

      // Assert: alert should be called with error message
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to fetch workout data.");
      });

      // router.back should NOT be called here because this is fetch error (not workout not found)
      expect(routerBackSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
      routerBackSpy.mockRestore();
    });

    test("alerts and navigates back when workout not found", async () => {
      // Arrange: getDoc resolves with exists() false
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
      const routerBackSpy = jest
        .spyOn(ExpoRouter.useRouter(), "back")
        .mockImplementation(jest.fn());

      // Act
      render(<AddWorkout />);

      // Assert alert and router.back
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Workout not found.");
        expect(routerBackSpy).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
      routerBackSpy.mockRestore();
    });
  });
});
