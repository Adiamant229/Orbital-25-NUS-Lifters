import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Macro from "../../app/(dashboard)/macro";
import { Alert } from "react-native";

jest.mock("../../firebaseConfig", () => ({
  app: {},
  db: {},
  auth: { currentUser: { uid: "mock-user-id" } },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("../../components/themedContext", () => ({
  useThemeContext: () => ({ theme: "light", setTheme: jest.fn() }),
}));

jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
  const deleteButton = buttons.find((b) => b.text === "Delete");
  deleteButton?.onPress();
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        foods: [
          {
            description: "Chicken Breast",
            foodNutrients: [
              { nutrientName: "Protein", value: 31 },
              { nutrientName: "Energy", value: 165 },
              { nutrientName: "Total lipid (fat)", value: 3.6 },
              { nutrientName: "Carbohydrate, by difference", value: 0 },
            ],
          },
        ],
      }),
  })
);

describe("Macro Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders macro summary section", async () => {
    const { getByText } = render(<Macro />);
    expect(getByText("Macro Tracker")).toBeTruthy();
    expect(getByText("Total Calories:")).toBeTruthy();
    expect(getByText("Total Protein:")).toBeTruthy();
    expect(getByText("Total Fat:")).toBeTruthy();
    expect(getByText("Total Carbs:")).toBeTruthy();
  });

  test("opens and closes search modal", async () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(
      <Macro />
    );

    fireEvent.press(getByText("Search Food"));
    expect(getByPlaceholderText("Search Food")).toBeTruthy();

    fireEvent(getByPlaceholderText("Search Food"), "onBlur");
    expect(queryByPlaceholderText("Search Food")).toBeTruthy();
  });

  test("searches and adds a food item", async () => {
    const { getByText, getByPlaceholderText, getByTestId, queryByText } =
      render(<Macro />);

    fireEvent.press(getByText("Search Food"));
    const input = getByPlaceholderText("Search Food");
    fireEvent.changeText(input, "chicken");

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await waitFor(() => expect(queryByText("Chicken Breast")).toBeTruthy());

    fireEvent.press(getByText("Chicken Breast"));

    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalled());
    expect(queryByText("Chicken Breast")).toBeTruthy();
  });

  test("updates servings and recalculates macros", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 0,
          description: "Chicken Breast",
          servings: 100,
          protein: 31,
          calories: 165,
          fat: 3.6,
          carbs: 0,
        },
      ])
    );

    const { getByDisplayValue, getByText } = render(<Macro />);

    await waitFor(() => {
      expect(getByText("Chicken Breast")).toBeTruthy();
    });

    const input = getByDisplayValue("100");
    fireEvent.changeText(input, "200");

    await waitFor(() => {
      expect(getByText("330.00 cal")).toBeTruthy();
      expect(getByText("62.00g")).toBeTruthy();
    });
  });

  test("deletes item from meal list", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 0,
          description: "Chicken Breast",
          servings: 100,
          protein: 31,
          calories: 165,
          fat: 3.6,
          carbs: 0,
        },
      ])
    );

    const { getByText, queryByText, getByTestId } = render(<Macro />);

    await waitFor(() => {
      expect(getByText("Chicken Breast")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button-0"));

    await waitFor(() => {
      expect(queryByText("Chicken Breast")).toBeNull();
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "mealList",
        JSON.stringify([])
      );
    });
  });

  test("handles empty meal list state", () => {
    const { getByText } = render(<Macro />);
    expect(getByText('Add foods with the "Search Food" Button!')).toBeTruthy();
  });
});
