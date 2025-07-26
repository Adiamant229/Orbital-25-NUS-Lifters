import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ExerciseProgress from "../../app/(progress)/exerciseProgress";
import { getAuth } from "firebase/auth";
import { query, collection, orderBy, where, getDocs } from "firebase/firestore";

jest.mock("../../firebaseConfig", () => ({
  db: {},
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => {
  return {
    query: jest.fn((...args) => ({ queryArgs: args })),
    collection: jest.fn(),
    orderBy: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
  };
});

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { View, TouchableOpacity, Text } = require("react-native");

  return (props) =>
    React.createElement(
      View,
      null,
      props.items.map((item) =>
        React.createElement(
          TouchableOpacity,
          {
            key: item.value,
            testID: `select-${item.value
              .toString()
              .toLowerCase()
              .replace(/\s/g, "-")}`,
            onPress: () => props.setValue(item.value),
          },
          React.createElement(Text, null, item.label),
        ),
      ),
    );
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe("ExerciseProgress Component", () => {
  const fakeUserId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();

    getAuth.mockReturnValue({
      currentUser: { uid: fakeUserId },
    });

    collection.mockReturnValue("collectionRef");
    orderBy.mockImplementation((field) => ({ orderByField: field }));
    where.mockImplementation(() => ({ whereField: "userId" }));
    query.mockImplementation(() => "queryMock");

    const fakeDocs = [
      {
        data: () => ({
          userId: fakeUserId,
          createdAt: {
            toDate: () => new Date("2025-05-10T10:00:00Z"),
          },
          exercises: [
            {
              name: "Bench Press",
              sets: [{ weight: 100 }, { weight: 110 }],
            },
            {
              name: "Squat",
              sets: [{ weight: 140 }, { weight: 150 }],
            },
          ],
        }),
      },
      {
        data: () => ({
          userId: fakeUserId,
          createdAt: {
            toDate: () => new Date("2025-05-15T12:00:00Z"),
          },
          exercises: [
            {
              name: "Bench Press",
              sets: [{ weight: 115 }],
            },
          ],
        }),
      },
    ];

    getDocs.mockResolvedValue({
      docs: fakeDocs,
    });
  });

  test("renders ExerciseProgress component and displays exercise and year dropdown items", async () => {
    const { getByText } = render(<ExerciseProgress />);

    expect(getByText("Exercise Progress")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("Bench Press")).toBeTruthy();
      expect(getByText("Squat")).toBeTruthy();
    });

    const currentYear = new Date().getFullYear().toString();
    await waitFor(() => {
      expect(getByText(currentYear)).toBeTruthy();
    });
  });

  test("selects exercise and displays corresponding chart", async () => {
    const { getByText, queryByText, getByTestId } = render(
      <ExerciseProgress />,
    );

    await waitFor(() => {
      expect(getByText("Bench Press")).toBeTruthy();
    });

    fireEvent.press(getByTestId("select-bench-press"));

    const currentYear = new Date().getFullYear().toString();
    await waitFor(() => {
      expect(getByText(`Bench Press (${currentYear})`)).toBeTruthy();
    });

    expect(queryByText(`Squat (${currentYear})`)).toBeNull();
  });

  test("calls getDocs once to fetch workouts", async () => {
    render(<ExerciseProgress />);
    await waitFor(() => {
      expect(getDocs).toHaveBeenCalledTimes(1);
    });
  });
});
