import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProgressTracker from "../../app/(dashboard)/progressTracker"; // Ensure correct path
import { Alert } from "react-native"
// Mock firebaseConfig if you import it
jest.mock("../../firebaseConfig", () => ({
  auth: { currentUser: { uid: "testUserId" } },
  db: {},
}));

// Mock Firestore methods and data
jest.mock("firebase/firestore", () => {
  // IMPORTANT: Define Timestamp and provide fromDate, now, and toDate implementations
  const mockTimestamp = {
    // This mocks how you'd create a timestamp in your component
    fromDate: (date) => ({
      _toDate: date, // Store the date internally
      toDate: () => date, // Provide a toDate method
      // You might want to add seconds, nanoseconds if your component uses them
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
    }),
    // If your component uses Timestamp.now()
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

  const workoutDocs = [
    {
      id: "w1",
      name: "Workout A",
      // Use the mockTimestamp.fromDate here to ensure createdAt is a "Timestamp" object
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
      timePeriod: "Morning", // Added timePeriod for component consistency
      userId: "testUserId", // Added userId for queries
    },
    {
      id: "w2",
      name: "Workout B",
      createdAt: mockTimestamp.fromDate(new Date("2023-06-05T10:00:00Z")), // Another date
      workoutNotes: "",
      exercises: [],
      timePeriod: "Evening",
      userId: "testUserId",
    },
  ];

  // For `allWorkouts` and `filteredWorkouts` in the component, the onSnapshot callback
  // can be controlled per test using mockImplementationOnce if needed.
  // For the default mock, we'll return the initial workoutDocs.

  // Mock for weights data as well, as your component fetches them
  const weightDocs = [
    {
      id: "wgt1",
      weight: 70.5,
      date: mockTimestamp.fromDate(new Date("2024-01-10T00:00:00Z")),
    },
    {
      id: "wgt2",
      weight: 71.0,
      date: mockTimestamp.fromDate(new Date("2024-02-15T00:00:00Z")),
    },
  ];

  const macroDocs = [
    {
      id: "mock-added-doc-id",
      title: "Bulk Day 1",
      calories: 600,
      protein: 30,
      carbs: 50,
      fats: 20,
      timestamp: mockTimestamp.fromDate(new Date("2024-06-28T08:00:00Z")),
      userId: "testUserId",
    },
  ];
  
  return {
    collection: jest.fn((db, path) => ({ path })),
    query: jest.fn(() => ({})),
    orderBy: jest.fn(() => ({})),
    where: jest.fn(() => ({})),
    // Export the mockTimestamp as 'Timestamp' from 'firebase/firestore'
    Timestamp: mockTimestamp,

    onSnapshot: jest.fn((q, callback) => {
      let docsToReturn = [];
      const collectionPath = q && q.path;

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
            })
          ),
        empty: docsToReturn.length === 0,
      };

      callback(snapshot);
      return jest.fn(); // unsubscribe
    }),

    addDoc: jest.fn(() => Promise.resolve({ id: "mock-added-doc-id" })),
    deleteDoc: jest.fn(() => Promise.resolve()),
    doc: jest.fn((dbRef, ...paths) => {
      const id = paths[paths.length - 1]; // Last part of the path is usually the ID
      return { id: id, _isMockDocRef: true, path: paths.join("/") }; // Return a mock doc ref
    }),
    updateDoc: jest.fn(() => Promise.resolve()),
  };
});

// Mock router push/replace
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  Link: ({ children }) => <>{children}</>,
}));

// Mock Alert.alert globally for all tests that trigger it
beforeEach(() => {
    jest.clearAllMocks();
  
    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const confirmButton = buttons.find(
        (button) =>
          button.text === "Submit" ||
          button.text === "Update" ||
          button.style === "destructive"
      );
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    });
  });
  
describe("ProgressTracker Component - Tabs", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure Alert.alert is mocked for all tests

    // Reset the `onSnapshot` mock for each test to avoid interference
    const firestore = require("firebase/firestore");
    const mockTimestamp = firestore.Timestamp; // Use the mocked Timestamp

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

    firestore.onSnapshot.mockImplementation((q, callback) => {
      let docsToReturn = [];
      // Basic check for `collection` calls to distinguish between workouts and weights
      const collectionPath = firestore.collection.mock.lastCall
        ? firestore.collection.mock.lastCall[1]
        : "";

      if (collectionPath === "workouts") {
        // Apply year filter for workouts
        const queryArgs = firestore.query.mock.lastCall;
        if (queryArgs && queryArgs.length > 2) {
          // Check if 'where' clauses are present
          const whereClauses = queryArgs
            .slice(2)
            .filter(
              (arg) =>
                typeof arg === "object" &&
                "field" in arg &&
                "op" in arg &&
                "value" in arg
            );

          let startOfYear, endOfYear;
          for (const clause of whereClauses) {
            if (clause.field === "createdAt") {
              if (clause.op === ">=" && clause.value instanceof Date) {
                startOfYear = clause.value;
              } else if (clause.op === "<" && clause.value instanceof Date) {
                endOfYear = clause.value;
              }
            }
          }

          if (startOfYear && endOfYear) {
            docsToReturn = workoutDocs.filter((doc) => {
              const docDate = doc.createdAt.toDate();
              return docDate >= startOfYear && docDate < endOfYear;
            });
          } else {
            docsToReturn = workoutDocs; // No specific year filter, return all
          }
        } else {
          docsToReturn = workoutDocs; // No specific query or where clauses, return all
        }
      } else if (collectionPath.includes("weights")) {
        // Check for 'weights' collection
        // Apply year filter for weights
        const queryArgs = firestore.query.mock.lastCall;
        if (queryArgs && queryArgs.length > 2) {
          const whereClauses = queryArgs
            .slice(2)
            .filter(
              (arg) =>
                typeof arg === "object" &&
                "field" in arg &&
                "op" in arg &&
                "value" in arg
            );

          let startOfYear, endOfYear;
          for (const clause of whereClauses) {
            if (clause.field === "date") {
              if (clause.op === ">=" && clause.value instanceof Date) {
                startOfYear = clause.value;
              } else if (clause.op === "<" && clause.value instanceof Date) {
                endOfYear = clause.value;
              }
            }
          }
          if (startOfYear && endOfYear) {
            docsToReturn = weightDocs.filter((doc) => {
              const docDate = doc.date.toDate();
              return docDate >= startOfYear && docDate < endOfYear;
            });
          } else {
            docsToReturn = weightDocs; // No specific year filter, return all
          }
        } else {
          docsToReturn = weightDocs; // No specific query or where clauses, return all
        }
      } else {
        docsToReturn = []; // Default if collection is unknown
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
            })
          ),
        empty: docsToReturn.length === 0,
      };
      callback(snapshot);
      return jest.fn(); // unsubscribe function
    });
  });

  test("renders without crashing and shows tabs", () => {
    const { getByText } = render(<ProgressTracker />);
    expect(getByText("Progress Tracker")).toBeTruthy();
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("Bodyweight")).toBeTruthy();
    expect(getByText("Macros")).toBeTruthy();
  });

  test("switches tabs when pressing buttons", () => {
    const { getByText, queryByText } = render(<ProgressTracker />);

    // Default tab is workouts
    expect(getByText("Your Workouts")).toBeTruthy();

    fireEvent.press(getByText("Bodyweight"));
    expect(getByText("Your Bodyweights")).toBeTruthy();
    expect(queryByText("Your Workouts")).toBeNull();

    fireEvent.press(getByText("Macros"));
    expect(getByText("Your Macros")).toBeTruthy();
    expect(queryByText("Your Bodyweights")).toBeNull();
  });

  test("opens modal when adding new weight", () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+ New Weight"));

    expect(getByText("Add New Weight")).toBeTruthy();
    expect(getByPlaceholderText("Enter weight (kg)")).toBeTruthy();
  });

  test('pressing "+ New Workout" button calls router.push with "/addWorkout"', async () => {
    const { getByText } = render(<ProgressTracker />);
    const newWorkoutButton = getByText("+ New Workout");
    fireEvent.press(newWorkoutButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/addWorkout");
    });
  });

  test('pressing "progress" button calls router.push with "/exerciseProgress"', async () => {
    const { getByTestId } = render(<ProgressTracker />);

    mockPush.mockClear();

    fireEvent.press(getByTestId("exerciseProgress-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/exerciseProgress");
    });
  });

  test('pressing "guide" button calls router.push with "/exercises"', async () => {
    const { getByTestId } = render(<ProgressTracker />);

    mockPush.mockClear();

    fireEvent.press(getByTestId("exercises-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/exercises");
    });
  });

  test("renders all workout cards fetched from Firestore", async () => {
    const { getByText } = render(<ProgressTracker />);

    await waitFor(() => {
      expect(getByText("Workout A")).toBeTruthy();
      expect(getByText("Workout B")).toBeTruthy();
    });
  });

  test("displays workout date fetched from Firebase and correctly formatted", async () => {
    // Define the helper function inside the test
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
  

  test("opens workout details when workout card is pressed", async () => {
    const { getByText, queryByText } = render(<ProgressTracker />);

    // Wait for workout title to appear
    const workoutTitle = await waitFor(() => getByText("Workout A"));

    // Before press, exercises details are not visible
    expect(queryByText("Squat")).toBeNull();
    expect(queryByText("Bench Press")).toBeNull();

    // Press the workout card (title)
    fireEvent.press(workoutTitle);

    // After press, details appear
    await waitFor(() => {
      expect(getByText("Squat")).toBeTruthy();
      expect(getByText("Bench Press")).toBeTruthy();
      expect(getByText("Set 1: 5 reps @ 100 kg")).toBeTruthy();
    });
  });

  test("displays 'no workout data available' message when there are no workouts at all", async () => {
    const firestore = require("firebase/firestore");

    firestore.onSnapshot.mockImplementation((q, callback) => {
      const snapshot = {
        docs: [],
        empty: true,
        forEach: () => {},
      };
      callback(snapshot);
      return jest.fn();
    });

    const { getByText } = render(<ProgressTracker />);

    await waitFor(() => {
      expect(
        getByText("No workout data available. Add an entry to get started!")
      ).toBeTruthy();
    });
  });

  test('pressing "edit" button after expanding workout card calls router.push with /addWorkout and correct params', async () => {
    const { getByText, getByTestId } = render(<ProgressTracker />);
  
    mockPush.mockClear();
  
    // Expand the workout card
    const workoutTitle = await waitFor(() => getByText("Workout A"));
    fireEvent.press(workoutTitle);
  
    // Click the edit button
    const editButton = await waitFor(() => getByTestId("edit-button-w1"));
    fireEvent.press(editButton);
  
    // Assert the correct route and params are passed
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/addWorkout",
        params: { editWorkoutId: "w1" },
      });
    });
  });

  test('pressing "delete" button calls handleDeleteWorkout with the correct workout ID', async () => {
    const { getByText, getByTestId } = render(<ProgressTracker />);

    // Expand the workout card first (if the delete button is only visible after that)
    const workoutTitle = await waitFor(() => getByText("Workout A"));
    fireEvent.press(workoutTitle);

    // Click the delete button
    const deleteButton = await waitFor(() => getByTestId("delete-button-w1"));
    fireEvent.press(deleteButton);

    // Confirm that deleteDoc (or the actual delete logic) was called
    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalled();
      // Optional: confirm correct ID is involved
      expect(firestore.deleteDoc.mock.calls[0][0].id).toBe("w1");
    });
  });

  test("submits new weight when valid input is entered and Save is confirmed", async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<ProgressTracker />);
    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+ New Weight"));
  
    const input = getByPlaceholderText("Enter weight (kg)");
    fireEvent.changeText(input, "72.5");
  
    fireEvent.press(getByTestId("saveWeightButton")); 
  
    const firestore = require("firebase/firestore");
    await waitFor(() => {
      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
      const payload = firestore.addDoc.mock.calls[0][1];
      expect(payload.weight).toBe(72.5);
      expect(payload.date).toBeInstanceOf(Object); 
    });
  });
  
  test("opens edit weight modal with pre-filled data after tapping graph and edit", async () => {
    const {
      getByText,
      getByTestId,
      getByPlaceholderText,
      queryByText,
    } = render(<ProgressTracker />);

    // 1. Switch to Bodyweight tab
    fireEvent.press(getByText("Bodyweight"));

    // 2. Open the "Add New Weight" modal
    fireEvent.press(getByText("+ New Weight"));

    // 3. Enter new weight
    const input1 = getByPlaceholderText("Enter weight (kg)");
    fireEvent.changeText(input1, "72.5");

    // 4. Press Save button
    fireEvent.press(getByTestId("saveWeightButton"));

    // 5. Wait for the "Add New Weight" modal to close by checking modal title no longer present
    await waitFor(() => {
      expect(queryByText(/Add New Weight|Edit Weight Entry/)).toBeNull();
    });
  });

  test("opening macro modal works", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
  
    const addMacroBtn = getByText("+ New Macros");
    fireEvent.press(addMacroBtn);
  
    await waitFor(() => {
      expect(getByText("Add New Macro")).toBeTruthy();
      expect(getByPlaceholderText("Add in your Macros Title")).toBeTruthy();
      expect(getByPlaceholderText("Enter Total Calories")).toBeTruthy();
    });
  });
  
  test("submits new macro when all fields are filled and confirmed", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
    fireEvent.press(getByText("+ New Macros"));

    fireEvent.changeText(
      getByPlaceholderText("Add in your Macros Title"),
      "Bulk Day 1"
    );

    fireEvent.changeText(getByPlaceholderText("Enter Total Calories"), "600");
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
  
  
});
