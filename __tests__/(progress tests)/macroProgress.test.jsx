import { render, fireEvent, waitFor } from "@testing-library/react-native";
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
              if (Array.isArray(props.value)) {
                const newVal = props.value.includes(item.value)
                  ? props.value.filter((v) => v !== item.value)
                  : [...props.value, item.value];
                props.setValue(newVal);
              } else {
                props.setValue(item.value);
              }
            },
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

describe("MacroProgress Component", () => {
  const fakeUserId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();

    getAuth.mockReturnValue({
      currentUser: { uid: fakeUserId },
    });

    collection.mockReturnValue("collectionRef");
    orderBy.mockImplementation(() => ({ orderByField: "createdAt" }));
    query.mockImplementation(() => "queryMock");

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

    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: fakeDocs });
      return jest.fn();
    });
  });

  test("renders MacroProgress component and displays macro and year dropdown items", async () => {
    const { getByText } = render(<MacroProgress />);

    expect(getByText("Macro Progress")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("Calories")).toBeTruthy();
      expect(getByText("Protein")).toBeTruthy();
      expect(getByText("Carbs")).toBeTruthy();
      expect(getByText("Fats")).toBeTruthy();
    });

    const currentYear = new Date().getFullYear().toString();
    await waitFor(() => {
      expect(getByText(currentYear)).toBeTruthy();
    });
  });

  test("selects and deselects macros and renders corresponding charts", async () => {
    const { getByText, queryByText, getByTestId } = render(<MacroProgress />);

    await waitFor(() => {
      expect(getByText(/Calories \(\d{4}\)/)).toBeTruthy();
    });

    fireEvent.press(getByTestId("select-calories"));
    await waitFor(() => {
      expect(queryByText(/Calories \(\d{4}\)/)).toBeNull();
    });

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
