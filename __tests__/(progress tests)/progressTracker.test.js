import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ProgressTracker from "../../app/(dashboard)/progressTracker";
import { Alert } from "react-native";
import firestore, { onSnapshot } from "firebase/firestore";
import store from "firebase/firestore";
import store2 from "firebase/firestore";

const defaultWeights = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("../../components/themedContext", () => ({
  useThemeContext: () => ({ theme: "light", setTheme: jest.fn() }),
}));

jest.mock("../../firebaseConfig", () => ({
  auth: { currentUser: { uid: "testUserId" } },
  db: {},
}));

jest.mock("firebase/firestore", () => {
  const mockTimestamp = {
    fromDate: (date) => ({
      _toDate: date,
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
    }),
    now: () => {
      const now = new Date();
      return {
        _toDate: now,
        toDate: () => now,
        seconds: Math.floor(now.getTime() / 1000),
        nanoseconds: (now.getTime() % 1000) * 1000000,
      };
    },
  };

  // Sample documents for mocking Firestore data
  const workoutDocs = [
    {
      id: "w1",
      name: "Workout A",
      createdAt: mockTimestamp.fromDate(new Date("2023-06-01T12:00:00Z")),
      workoutNotes: "Notes A",
      exercises: [
        {
          name: "Squat",
          sets: [
            { reps: 5, weight: 100 },
            { reps: 5, weight: 105 },
          ],
        },
        {
          name: "Bench Press",
          sets: [
            { reps: 5, weight: 60 },
            { reps: 3, weight: 65 },
          ],
        },
      ],
      timePeriod: "Morning",
      userId: "testUserId",
    },
    {
      id: "w2",
      name: "Workout B",
      createdAt: mockTimestamp.fromDate(new Date("2023-06-05T10:00:00Z")),
      workoutNotes: "",
      exercises: [],
      timePeriod: "Evening",
      userId: "testUserId",
    },
  ];

  const weightDocs = [
    {
      id: "wgt1",
      weight: 70.5,
      date: mockTimestamp.fromDate(new Date("2024-01-10T00:00:00Z")),
      userId: "testUserId",
    },
    {
      id: "wgt2",
      weight: 71.0,
      date: mockTimestamp.fromDate(new Date("2024-02-15T00:00:00Z")),
      userId: "testUserId",
    },
  ];

  const macroDocs = [
    {
      id: "macro1",
      title: "Cut Day 1",
      calories: 1800,
      protein: 140,
      carbs: 100,
      fats: 60,
      timestamp: mockTimestamp.fromDate(new Date("2024-06-10T08:00:00Z")),
      userId: "testUserId",
    },
    {
      id: "macro2",
      title: "Bulk Day 1",
      calories: 3000,
      protein: 200,
      carbs: 350,
      fats: 90,
      timestamp: mockTimestamp.fromDate(new Date("2024-06-28T08:00:00Z")),
      userId: "testUserId",
    },
  ];

  return {
    collection: jest.fn((...args) => ({ path: args.join("") })),
    query: jest.fn((collectionRef) => ({ ...collectionRef })),
    orderBy: jest.fn((queryRef) => ({ ...queryRef })), // Pass queryRef along
    where: jest.fn((queryRef) => ({ ...queryRef })), // Pass queryRef along

    Timestamp: mockTimestamp,

    onSnapshot: jest.fn((q, callback) => {
      let docsToReturn = [];
      const collectionPath = q?.path || ""; // Now q.path should be correctly set

      if (collectionPath.includes("workouts")) {
        docsToReturn = workoutDocs;
      } else if (collectionPath.includes("weights")) {
        docsToReturn = weightDocs;
      } else if (collectionPath.includes("macros")) {
        docsToReturn = macroDocs;
      }

      const snapshot = {
        docs: docsToReturn.map((doc) => ({
          id: doc.id,
          data: () => ({
            ...doc,
            createdAt: doc.createdAt || doc.date || doc.timestamp,
          }),
        })),
        forEach: (fn) =>
          docsToReturn.forEach((doc) =>
            fn({
              id: doc.id,
              data: () => ({
                ...doc,
                createdAt: doc.createdAt || doc.date || doc.timestamp,
              }),
            }),
          ),
        empty: docsToReturn.length === 0,
      };

      callback(snapshot);
      return jest.fn();
    }),

    addDoc: jest.fn(() => Promise.resolve({ id: "mock-added-doc-id" })),
    deleteDoc: jest.fn(() => Promise.resolve()),
    doc: jest.fn((dbRef, ...paths) => {
      const id = paths[paths.length - 1];
      return { id, _isMockDocRef: true, path: paths.join("/") };
    }),
    updateDoc: jest.fn(() => Promise.resolve()),
    getDocs: jest.fn(() =>
      Promise.resolve({
        docs: [],
        empty: true,
      }),
    ),
  };
});

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({
    importedMacro: "false",
    importedSelectedTab: "",
    importedCalories: "",
    importedProtein: "",
    importedFat: "",
    importedCarbs: "",
  }),
  Link: ({ children }) => <>{children}</>,
}));

// mock Alert.alert once for all tests
jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
  console.log("Alert triggered:", title, message);
  console.log("Buttons:", buttons);

  const confirmButton =
    buttons?.find((btn) =>
      ["Submit", "Update", "Yes", "Delete"].includes(btn.text),
    ) || buttons?.[0];

  console.log("Confirm button chosen:", confirmButton?.text);

  if (confirmButton?.onPress) {
    confirmButton.onPress();
  }
});

// Clear mocks and reset Firestore onSnapshot before each test
beforeEach(() => {
  jest.clearAllMocks();

  const firestore = require("firebase/firestore");
  const mockTimestamp = firestore.Timestamp;

  const workoutDocs = [
    {
      id: "w1",
      name: "Workout A",
      createdAt: mockTimestamp.fromDate(new Date("2023-06-01T12:00:00Z")),
      workoutNotes: "Notes A",
      exercises: [
        {
          name: "Squat",
          sets: [
            { reps: 5, weight: 100 },
            { reps: 5, weight: 105 },
          ],
        },
        {
          name: "Bench Press",
          sets: [
            { reps: 5, weight: 60 },
            { reps: 3, weight: 65 },
          ],
        },
      ],
      timePeriod: "Morning",
      userId: "testUserId",
    },
    {
      id: "w2",
      name: "Workout B",
      createdAt: mockTimestamp.fromDate(new Date("2023-06-05T10:00:00Z")),
      workoutNotes: "",
      exercises: [],
      timePeriod: "Evening",
      userId: "testUserId",
    },
  ];

  const weightDocs = [
    {
      id: "wgt1",
      weight: 70.5,
      date: mockTimestamp.fromDate(new Date("2024-01-10T00:00:00Z")),
      userId: "testUserId",
    },
    {
      id: "wgt2",
      weight: 71.0,
      date: mockTimestamp.fromDate(new Date("2024-02-15T00:00:00Z")),
      userId: "testUserId",
    },
  ];

  const macroDocs = [
    {
      id: "macro1",
      title: "Cut Day 1",
      calories: 1800,
      protein: 140,
      carbs: 100,
      fats: 60,
      timestamp: mockTimestamp.fromDate(new Date("2024-06-10T08:00:00Z")),
      userId: "testUserId",
    },
    {
      id: "macro2",
      title: "Bulk Day 1",
      calories: 3000,
      protein: 200,
      carbs: 350,
      fats: 90,
      timestamp: mockTimestamp.fromDate(new Date("2024-06-28T08:00:00Z")),
      userId: "testUserId",
    },
  ];

  firestore.onSnapshot.mockImplementation((q, callback) => {
    let docsToReturn = [];
    // FIX: Use q.path directly as the collection and query mocks now pass it through
    const collectionPath = q?.path || "";

    if (collectionPath.includes("workouts")) {
      docsToReturn = workoutDocs;
    } else if (collectionPath.includes("weights")) {
      docsToReturn = weightDocs;
    } else if (collectionPath.includes("macros")) {
      docsToReturn = macroDocs;
    }

    const snapshot = {
      docs: docsToReturn.map((doc) => ({
        id: doc.id,
        data: () => ({ ...doc }),
      })),
      forEach: (fn) =>
        docsToReturn.forEach((doc) =>
          fn({
            id: doc.id,
            data: () => ({ ...doc }),
          }),
        ),
      empty: docsToReturn.length === 0,
    };

    callback(snapshot);
    return jest.fn();
  });
});

describe("ProgressTracker Component - Tabs & UI", () => {
  test("renders without crashing and shows main tabs", () => {
    const { getByText } = render(<ProgressTracker />);
    expect(getByText("Progress Tracker")).toBeTruthy();
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("Bodyweight")).toBeTruthy();
    expect(getByText("Macros")).toBeTruthy();
  });

  test("switches tabs correctly on button press", () => {
    const { getByText, queryByText } = render(<ProgressTracker />);

    expect(getByText("Your Workouts")).toBeTruthy();

    fireEvent.press(getByText("Bodyweight"));
    expect(getByText("Your Bodyweights")).toBeTruthy();
    expect(queryByText("Your Workouts")).toBeNull();

    fireEvent.press(getByText("Macros"));
    expect(getByText("Your Macros")).toBeTruthy();
    expect(queryByText("Your Bodyweights")).toBeNull();
  });
});

describe("ProgressTracker Component - Workouts", () => {
  test("renders workout cards fetched from Firestore", async () => {
    const { getByText } = render(<ProgressTracker />);
    await waitFor(() => {
      expect(getByText("Workout A")).toBeTruthy();
      expect(getByText("Workout B")).toBeTruthy();
    });
  });

  test("workout year dropdown changes workout list", async () => {
    const { getByText, getByTestId, queryByText } = render(<ProgressTracker />);

    const yearButton = getByText("All");
    fireEvent.press(yearButton);
    const yearOption = getByText("2023");
    fireEvent.press(yearOption);

    await waitFor(() => {
      expect(queryByText("Workout A")).toBeTruthy();
    });
  });

  test("displays workout date formatted and relative", async () => {
    // Utility to calculate day difference ignoring time
    function calendarDaysDiff(d1, d2) {
      const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
      const diffTime = date2.getTime() - date1.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const { getByText } = render(<ProgressTracker />);
    const createdDate = new Date("2023-06-01T12:00:00Z");

    const dateStr = createdDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const now = new Date();
    const diffDays = calendarDaysDiff(createdDate, now);

    const relativeStr =
      diffDays === 0
        ? "Today"
        : diffDays === 1
          ? "1 day ago"
          : `${diffDays} days ago`;

    const expectedText = `${dateStr} Morning Workout (${relativeStr})`;

    await waitFor(() => {
      expect(getByText(expectedText)).toBeTruthy();
    });
  });

  test("opens workout details on card press", async () => {
    const { getByText, queryByText } = render(<ProgressTracker />);
    const workoutTitle = await waitFor(() => getByText("Workout A"));

    expect(queryByText("Squat")).toBeNull();
    expect(queryByText("Bench Press")).toBeNull();

    fireEvent.press(workoutTitle);

    await waitFor(() => {
      expect(getByText("Squat")).toBeTruthy();
      expect(getByText("Bench Press")).toBeTruthy();
      expect(getByText("Set 1: 5 reps @ 100 kg")).toBeTruthy();
    });
  });

  test("shows no workout data message when empty", async () => {
    const firestore = require("firebase/firestore");

    firestore.onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [],
        empty: true,
        forEach: () => {},
      });
      return jest.fn();
    });

    const { getByText } = render(<ProgressTracker />);

    await waitFor(() => {
      expect(
        getByText("No workout data available. Add an entry to get started!"),
      ).toBeTruthy();
    });
  });

  test('pressing "edit" button navigates with correct params', async () => {
    const { getByText, getByTestId } = render(<ProgressTracker />);
    mockPush.mockClear();

    const workoutTitle = await waitFor(() => getByText("Workout A"));
    fireEvent.press(workoutTitle);

    const editButton = await waitFor(() => getByTestId("edit-button-w1"));
    fireEvent.press(editButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/addWorkout",
        params: { editWorkoutId: "w1" },
      });
    });
  });

  test('pressing "delete" button calls Firestore deleteDoc with correct ID', async () => {
    const { getByText, getByTestId } = render(<ProgressTracker />);
    const workoutTitle = await waitFor(() => getByText("Workout A"));
    fireEvent.press(workoutTitle);

    const deleteButton = await waitFor(() => getByTestId("delete-button-w1"));
    fireEvent.press(deleteButton);

    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalled();
      expect(firestore.deleteDoc.mock.calls[0][0].id).toBe("w1");
    });
  });
});

describe("ProgressTracker Component - Bodyweight", () => {
  const firestore = require("firebase/firestore");
  test("opens modal for adding new weight", () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+"));

    expect(getByText("Add New Weight")).toBeTruthy();
    expect(getByPlaceholderText("Enter weight (kg)")).toBeTruthy();
  });

  test("empty weight input shows alert", () => {
    const { getByText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+"));
    fireEvent.press(getByText("Submit"));

    expect(Alert.alert).toHaveBeenCalledWith("Please enter your weight");
  });

  test("cancelling weight entry with changes prompts confirmation", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+"));
    fireEvent.changeText(getByPlaceholderText("Enter weight (kg)"), "72");
    fireEvent.press(getByText("Cancel"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Discard Entry",
        "Are you sure you want to discard this new weight entry?",
        expect.any(Array),
      );
    });
  });

  test("cancelling weight entry without changes closes modal silently", async () => {
    const { getByText, queryByText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+"));
    fireEvent.press(getByText("Cancel"));
    await waitFor(() => {
      expect(queryByText("Add New Weight")).toBeNull();
    });
  });

  test("submits new weight correctly when fields filled and submitted", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <ProgressTracker />,
    );

    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+"));

    fireEvent.changeText(getByPlaceholderText("Enter weight (kg)"), "75.5");
    fireEvent.press(getByText("Submit"));

    console.log("addDoc mock is function?", typeof firestore.addDoc);

    try {
      await waitFor(() => {
        console.log(
          "Checking if addDoc was called:",
          firestore.addDoc.mock.calls.length,
        );
        expect(firestore.addDoc).toHaveBeenCalledTimes(1);

        const payload = firestore.addDoc.mock.calls[0][1];
        console.log("Payload sent to addDoc:", payload);

        expect(payload.weight).toBe(75.5);
        expect(queryByText("Add New Weight")).toBeNull(); // Modal should close
      });
    } catch (error) {
      console.error("Test failed with error:", error);
      throw error; // rethrow so test still fails and you see the error
    }
  });

  test("editing an existing weight entry updates Firestore", async () => {
    // Wrap initial render in act
    const {
      getByText,
      getByTestId,
      getByDisplayValue,
      queryByText,
      queryAllByText,
      queryByTestId,
      debug,
    } = render(<ProgressTracker />);
    const firestore = require("firebase/firestore");

    // Wrap fireEvent and subsequent state updates in act
    await act(async () => {
      fireEvent.press(getByText("Bodyweight"));
    });
    console.log("✅ Pressed Bodyweight tab");

    await act(async () => {
      const mockCollection = firestore.collection("gay", "ass", "weights");
      const mockQuery = firestore.query(mockCollection);
      const unsubscribe = firestore.onSnapshot(mockQuery, (snapshot) => {
        console.log(
          "Callback received snapshot with",
          snapshot?.docs.length,
          "docs",
        );
        snapshot?.docs.map((doc) => {
          const data = { id: doc.id, ...doc.data() };
          console.log(data);
        });
      });
      unsubscribe();
    });

    /* await act(async () => {
      fireEvent.press(getByTestId("weightDropdown"));
    });
    console.log("✅ Pressed Select Year dropdown");

    // Wait for the dropdown items to appear and then assert

    await waitFor(() => {
      const yearTexts = queryAllByText(/\d{4}/).map(
        (el) => el.props?.children || el
      );
      console.log("📅 Dropdown year options rendered:", yearTexts);
      expect(yearTexts).not.toBeNull();
    });

    fireEvent.press(getByText("2024"));
    console.log("✅ Selected 2024"); */

    // Confirm the weight graph appears
    const graph = await waitFor(
      () => {
        console.log("test");
        const el = getByTestId("bodyweight-graph");
        expect(el).toBeTruthy();
        return el;
      },
      { timeout: 5000 },
    );

    fireEvent.press(graph);
    console.log("✅ Pressed bodyweight graph to open weight list modal");

    // Wait for weight list modal and the edit button for wgt1
    const editButton = await waitFor(() => {
      const el = getByTestId("edit-weight-wgt1");
      console.log("✏️ Found edit button for weight entry wgt1");
      return el;
    });

    fireEvent.press(editButton);
    console.log("✅ Pressed edit button");

    const weightInput = getByDisplayValue("70.5");
    console.log("✍️ Found input field with 70.5");

    fireEvent.changeText(weightInput, "72.0");
    console.log("✍️ Changed weight input to 72.0");

    fireEvent.press(getByText("Save"));
    console.log("✅ Pressed Save");

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
      const [docRef, payload] = firestore.updateDoc.mock.calls[0];
      console.log("🛠️ updateDoc called with:", { id: docRef.id, payload });

      expect(docRef.id).toBe("wgt1");
      expect(payload.weight).toBe(72.0);
    });

    console.log("🎉 Test completed successfully");
  });

  test("deleting an existing weight entry calls Firestore deleteDoc", async () => {
    const { getByText, getByTestId } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));

    // Find a way to trigger deletion, e.g., by long-pressing or clicking a delete icon
    // For this mock, let's assume we can find a delete button associated with "wgt1"
    const graph = getByTestId("bodyweight-graph");
    fireEvent.press(graph);
    const weightEntryText = await waitFor(() => getByText(/70.5/i));
    fireEvent.press(weightEntryText); // Open edit/delete modal
    const deleteButton = getByTestId("delete-button-wgt1"); // Assuming a delete button exists in the modal
    fireEvent.press(deleteButton);

    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalledTimes(1);
      const docRef = firestore.deleteDoc.mock.calls[0][0];
      expect(docRef.id).toBe("wgt1");
    });
  });
});

describe("ProgressTracker Component - Macros", () => {
  test("opens macro modal when '+' pressed", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));

    const addMacroBtn = getByText("+");
    fireEvent.press(addMacroBtn);

    await waitFor(() => {
      expect(getByText("Add New Macro")).toBeTruthy();
      expect(getByPlaceholderText("Add in your Macros Title")).toBeTruthy();
      expect(getByPlaceholderText("Enter Total Calories (cal)")).toBeTruthy();
    });
  });

  test("submits new macro correctly when fields filled and submitted", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
    fireEvent.press(getByText("+"));

    fireEvent.changeText(
      getByPlaceholderText("Add in your Macros Title"),
      "Bulk Day 1",
    );
    fireEvent.changeText(
      getByPlaceholderText("Enter Total Calories (cal)"),
      "600",
    );
    fireEvent.changeText(getByPlaceholderText("Enter Total Protein (g)"), "30");
    fireEvent.changeText(getByPlaceholderText("Enter Total Carbs (g)"), "50");
    fireEvent.changeText(getByPlaceholderText("Enter Total Fats (g)"), "20");

    fireEvent.press(getByText("Submit"));

    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
      const payload = firestore.addDoc.mock.calls[0][1];
      expect(payload.title).toBe("Bulk Day 1");
    });
  });

  test("cancelling macro entry with changes prompts confirmation", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
    fireEvent.press(getByText("+"));
    fireEvent.changeText(
      getByPlaceholderText("Add in your Macros Title"),
      "Test Macro",
    );
    fireEvent.press(getByText("Cancel"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        expect.any(Array),
      );
    });
  });

  test("cancelling macro entry without changes closes modal", async () => {
    const { getByText, queryByText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
    fireEvent.press(getByText("+"));
    fireEvent.press(getByText("Cancel"));
    await waitFor(() => {
      expect(queryByText("Add New Macro")).toBeNull();
    });
  });

  test("renders macro cards fetched from Firestore", async () => {
    const { getByText, debug } = render(<ProgressTracker />);

    fireEvent.press(getByText("Macros"));

    // Wait for macro cards to appear
    const cut = getByText("Cut Day 1");
    expect(cut).toBeTruthy();
    await act(() => {
      fireEvent.press(cut);
    });
    const bulk = getByText("Bulk Day 1");
    expect(getByText("Bulk Day 1")).toBeTruthy();
    await act(() => {
      fireEvent.press(bulk);
    });
    expect(getByText(/Calories: 1800 cal/i)).toBeTruthy();
    expect(getByText(/protein: 140 g/i)).toBeTruthy();
    expect(getByText(/carbs: 100 g/i)).toBeTruthy();
    expect(getByText(/fats: 60 g/i)).toBeTruthy();
  });

  test("editing an existing macro entry updates Firestore", async () => {
    const { getByText, getByTestId, getByDisplayValue, debug } = render(
      <ProgressTracker />,
    );
    fireEvent.press(getByText("Macros"));

    // Open the macro edit modal for "Cut Day 1"
    const macroTitle = await waitFor(() => getByText("Cut Day 1"));
    fireEvent.press(macroTitle);
    act(() => {
      fireEvent.press(getByTestId(/edit-button-macro1/i));
    });

    const caloriesInput = await waitFor(() => getByDisplayValue(/1800/i));
    act(() => {
      fireEvent.changeText(caloriesInput, "1900");
    });
    debug();
    act(() => {
      fireEvent.press(getByText(/Save/i));
    });

    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
      const docRef = firestore.updateDoc.mock.calls[0][0];
      const payload = firestore.updateDoc.mock.calls[0][1];
      expect(docRef.id).toBe("macro1"); // Assuming 'macro1' is the ID for "Cut Day 1"
      expect(payload.calories).toBe(1900);
    });
  });

  test("deleting an existing macro entry calls Firestore deleteDoc", async () => {
    const { getByText, getByTestId } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));

    // Open the macro edit modal for "Cut Day 1"
    const macroTitle = await waitFor(() => getByText("Cut Day 1"));
    fireEvent.press(macroTitle);

    const deleteButton = getByText("Delete"); // Assuming a delete button exists in the modal
    fireEvent.press(deleteButton);

    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalledTimes(1);
      const docRef = firestore.deleteDoc.mock.calls[0][0];
      expect(docRef.id).toBe("macro1");
    });
  });

  test("empty macro input fields show alert on submit", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
    fireEvent.press(getByText("+"));

    fireEvent.press(getByText("Submit"));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Please fill in all fields.");
    });
  });
});

// Additional navigation button tests
describe("Navigation Buttons", () => {
  test('"+ New Workout" button navigates correctly', () => {
    const { getByText } = render(<ProgressTracker />);
    fireEvent.press(getByText("+"));
    expect(mockPush).toHaveBeenCalledWith("/addWorkout");
  });

  test("progress button navigates to exerciseProgress", () => {
    const { getByTestId } = render(<ProgressTracker />);
    fireEvent.press(getByTestId("exerciseProgress-button"));
    expect(mockPush).toHaveBeenCalledWith("/exerciseProgress");
  });

  test("guide button navigates to exercises", () => {
    const { getByTestId } = render(<ProgressTracker />);
    fireEvent.press(getByTestId("exercises-button"));
    expect(mockPush).toHaveBeenCalledWith("/exercises");
  });
});
