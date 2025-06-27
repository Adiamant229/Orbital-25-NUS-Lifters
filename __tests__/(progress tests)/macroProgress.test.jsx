import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { View, TouchableOpacity, Text } from "react-native"; // Needed for dropdown mock
import MacroProgress from "../../app/(progress)/macroProgress";
import { getAuth } from "firebase/auth";
import { query, collection, orderBy, onSnapshot } from "firebase/firestore";

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
            onPress: () => {
              // If multiple selection, props.setValue should handle array, simulate that:
              if (Array.isArray(props.value)) {
                // toggle item value in array
                const newVal = props.value.includes(item.value)
                  ? props.value.filter((v) => v !== item.value)
                  : [...props.value, item.value];
                props.setValue(newVal);
              } else {
                props.setValue(item.value);
              }
            },
          },
          React.createElement(Text, null, item.label)
        )
      )
    );
});

describe("MacroProgress Component", () => {
  const fakeUserId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();

    getAuth.mockReturnValue({
      currentUser: { uid: fakeUserId },
    });

    collection.mockReturnValue("collectionRef");
    orderBy.mockImplementation(() => ({ orderByField: "createdAt" }));
    query.mockImplementation(() => "queryMock");

    // Prepare fake snapshot docs for macro entries
    const fakeDocs = [
      {
        data: () => ({
          calories: 2000,
          protein: 150,
          carbs: 250,
          fats: 70,
          createdAt: { toDate: () => new Date("2025-05-10T10:00:00Z") },
        }),
      },
      {
        data: () => ({
          calories: 2100,
          protein: 160,
          carbs: 260,
          fats: 65,
          createdAt: { toDate: () => new Date("2025-05-15T12:00:00Z") },
        }),
      },
    ];

    // Mock onSnapshot to immediately call the callback with fake snapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: fakeDocs });
      return jest.fn(); // unsubscribe function
    });
  });

  test("renders MacroProgress component and displays macro and year dropdown items", async () => {
    const { getByText } = render(<MacroProgress />);

    expect(getByText("Macro Progress")).toBeTruthy();

    // macros are fixed, check some macro dropdown items
    await waitFor(() => {
      expect(getByText("Calories")).toBeTruthy();
      expect(getByText("Protein")).toBeTruthy();
      expect(getByText("Carbs")).toBeTruthy();
      expect(getByText("Fats")).toBeTruthy();
    });

    // check year dropdown items (current year and +/- 1 year)
    const currentYear = new Date().getFullYear().toString();
    await waitFor(() => {
      expect(getByText(currentYear)).toBeTruthy();
    });
  });

  test("selects and deselects macros and renders corresponding charts", async () => {
    const { getByText, queryByText, getByTestId } = render(<MacroProgress />);

    // Initially all macros selected, check one chart
    await waitFor(() => {
      expect(getByText(/Calories \(\d{4}\)/)).toBeTruthy();
    });

    // Deselect "Calories"
    fireEvent.press(getByTestId("select-calories"));
    await waitFor(() => {
      expect(queryByText(/Calories \(\d{4}\)/)).toBeNull();
    });

    // Select "Calories" again
    fireEvent.press(getByTestId("select-calories"));
    await waitFor(() => {
      expect(getByText(/Calories \(\d{4}\)/)).toBeTruthy();
    });
  });

  test("calls onSnapshot once to listen for macro data", () => {
    render(<MacroProgress />);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
  });
});
