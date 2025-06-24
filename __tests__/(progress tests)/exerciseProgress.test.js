import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { View, TouchableOpacity, Text } from "react-native"; // Needed for dropdown mock
import ExerciseProgress from "../../app/(progress)/exerciseProgress";
import { getAuth } from "firebase/auth";
import {
  query,
  collection,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";

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
    onSnapshot: jest.fn(),
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
          React.createElement(Text, null, item.label)
        )
      )
    );
});

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

    const fakeSnapshot = {
      docs: [
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
      ],
    };

    onSnapshot.mockImplementation((query, callback) => {
      callback(fakeSnapshot);
      return jest.fn(); 
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
      <ExerciseProgress />
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

  test("calls onSnapshot once to listen to workouts", () => {
    render(<ExerciseProgress />);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
  });
});
