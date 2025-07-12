import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProgressTracker from "../../app/(dashboard)/progressTracker"; 
import { Alert } from "react-native"

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
      createdAt: mockTimestamp.fromDate(new Date("2023-06-05T10:00:00Z")), // Another date
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
      return jest.fn(); 
    }),

    addDoc: jest.fn(() => Promise.resolve({ id: "mock-added-doc-id" })),
    deleteDoc: jest.fn(() => Promise.resolve()),
    doc: jest.fn((dbRef, ...paths) => {
      const id = paths[paths.length - 1]; 
      return { id: id, _isMockDocRef: true, path: paths.join("/") }; 
    }),
    updateDoc: jest.fn(() => Promise.resolve()),
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


beforeEach(() => {
    jest.clearAllMocks();
  
    jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons = []) => {
        const confirmButton = buttons.find(
          (button) =>
            button.text === "Submit" ||
            button.text === "Update" ||
            button.style === "destructive"
        );
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      });
    
  });
  
describe("ProgressTracker Component - Tabs", () => {
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

    firestore.onSnapshot.mockImplementation((q, callback) => {
      let docsToReturn = [];
      const collectionPath = firestore.collection.mock.lastCall
        ? firestore.collection.mock.lastCall[1]
        : "";

      if (collectionPath === "workouts") {
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
            docsToReturn = workoutDocs; 
          }
        } else {
          docsToReturn = workoutDocs; 
        }
      } else if (collectionPath.includes("weights")) {
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
            docsToReturn = weightDocs; 
          }
        } else {
          docsToReturn = weightDocs; 
        }
      } else {
        docsToReturn = []; 
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
      return jest.fn();
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
    fireEvent.press(getByText("+"));

    expect(getByText("Add New Weight")).toBeTruthy();
    expect(getByPlaceholderText("Enter weight (kg)")).toBeTruthy();
  });

  test('pressing "+ New Workout" button calls router.push with "/addWorkout"', async () => {
    const { getByText } = render(<ProgressTracker />);
    const newWorkoutButton = getByText("+");
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

  test('pressing "delete" button calls handleDeleteWorkout with the correct workout ID', async () => {
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

 /* test("submits new weight when valid input is entered and Save is confirmed", async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <ProgressTracker />
    );

    fireEvent.press(getByText("Bodyweight"));
    fireEvent.press(getByText("+"));

    const input = getByPlaceholderText("Enter weight (kg)");
    fireEvent.changeText(input, "72.5");

    const firestore = require("firebase/firestore");

    const mockWeightDoc1 = {
      id: "dup1",
      data: () => ({
        weight: 70.0,
        date: firestore.Timestamp.fromDate(new Date("2024-07-09T00:00:00Z")),
      }),
    };
    const mockWeightDoc2 = {
      id: "dup2",
      data: () => ({
        weight: 71.0,
        date: firestore.Timestamp.fromDate(new Date("2024-07-09T00:00:00Z")),
      }),
    };

    // Mock getDocs for deduplication logic:
    firestore.getDocs
      .mockResolvedValueOnce({
        docs: [], // no existing weights initially, so addDoc runs
      })
      .mockResolvedValueOnce({
        docs: [mockWeightDoc1, mockWeightDoc2], // duplicates exist => trigger deleteDoc
      });

    firestore.addDoc.mockClear();
    firestore.deleteDoc.mockClear();

    fireEvent.press(getByTestId("saveWeightButton"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
      expect(firestore.deleteDoc).toHaveBeenCalledTimes(1);
      const payload = firestore.addDoc.mock.calls[0][1];
      expect(payload.weight).toBe(72.5);
    });
  });*/
  
  
  test("opening macro modal works", async () => {
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
  
  test("submits new macro when all fields are filled and confirmed", async () => {
    const { getByText, getByPlaceholderText } = render(<ProgressTracker />);
    fireEvent.press(getByText("Macros"));
    fireEvent.press(getByText("+"));

    fireEvent.changeText(
      getByPlaceholderText("Add in your Macros Title"),
      "Bulk Day 1"
    );

    fireEvent.changeText(getByPlaceholderText("Enter Total Calories (cal)"), "600");
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
