import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import ExerciseProgress from "../../app/(progress)/exerciseProgress";

// Mock LineChart with test-friendly output
jest.mock("react-native-chart-kit", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    LineChart: ({ data }) => (
      <Text>Mock Chart with {data?.datasets[0]?.data?.length} points</Text>
    ),
  };
});


// Mock dropdowns
jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return jest.fn().mockImplementation(({ placeholder }) => {
    return <Text>{placeholder}</Text>;
  });
});


// Mock Firebase
jest.mock("../../firebaseConfig", () => ({
  auth: {},
  db: {},
}));

jest.mock("firebase/firestore", () => {
  return {
    query: jest.fn(),
    collection: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn((q, callback) => {
      const fakeSnapshot = {
        docs: [
          {
            data: () => ({
              createdAt: {
                toDate: () => new Date("2024-06-01"),
              },
              exercises: [
                {
                  name: "Bench Press",
                  sets: [{ weight: 100 }, { weight: 110 }, { weight: 105 }],
                },
              ],
            }),
          },
        ],
      };
      callback(fakeSnapshot);
      return () => {};
    }),
  };
});

describe("ExerciseProgress", () => {

  it("renders correctly and shows chart", async () => {
    const { findByText } = render(<ExerciseProgress />);
    await findByText("Mock Chart with 1 points");
  });

  it("renders dropdown placeholders", () => {
    const { getByText } = render(<ExerciseProgress />);
    expect(getByText("Select Exercise")).toBeTruthy();
    expect(getByText("Select Year")).toBeTruthy();
  });
});
