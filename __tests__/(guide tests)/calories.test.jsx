import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Calories from "../../app/(guide)/calories";
import {
  katchBMRCalc,
  calculateActivityLevel,
} from "../../app/(guide)/calories";

import { Alert } from "react-native";

// Mock dependencies
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props) => <></>,
  };
});

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("react-native-dropdown-picker", () => {
  return ({ items, value, setValue }) => {
    return <></>;
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("../../components/themedContext", () => ({
  useThemeContext: () => ({ theme: "light", setTheme: jest.fn() }),
}));

describe("Calories Screen", () => {
  test("renders correctly", () => {
    const { getByText } = render(<Calories />);
    expect(getByText("How many calories should I eat?")).toBeTruthy();
    expect(getByText("Calorie Calculator")).toBeTruthy();
  });

  test("shows error on empty submit", async () => {
    const { getByText, queryByText } = render(<Calories />);
    fireEvent.press(getByText("Calculate"));
    await waitFor(() => {
      expect(getByText("Please input valid weight")).toBeTruthy();
      expect(getByText("Please input valid height")).toBeTruthy();
      expect(getByText("Please input valid age")).toBeTruthy();
      expect(queryByText(/Your BMR:/)).toBeNull();
    });
  });

  test("calculates BMR with valid Mifflin inputs", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <Calories />
    );
    fireEvent.changeText(getByPlaceholderText("Enter weight"), "70");
    fireEvent.changeText(getByPlaceholderText("Enter height"), "175");
    fireEvent.changeText(getByPlaceholderText("Enter age"), "25");
    fireEvent.press(getByText("Calculate"));
    await waitFor(() => {
      expect(queryByText(/Your BMR:/)).toBeTruthy();
    });
  });

  test("switches to Katch mode and shows fat input", () => {
    const { getByText, getByPlaceholderText } = render(<Calories />);
    fireEvent.press(getByText("Katch-McArdle"));
    expect(getByPlaceholderText("Enter fat %")).toBeTruthy();
  });

  test("shows fat input error in Katch mode if invalid", async () => {
    const { getByText, getByPlaceholderText } = render(<Calories />);
    fireEvent.press(getByText("Katch-McArdle"));
    fireEvent.changeText(getByPlaceholderText("Enter weight"), "70");
    fireEvent.changeText(getByPlaceholderText("Enter height"), "175");
    fireEvent.changeText(getByPlaceholderText("Enter age"), "25");
    fireEvent.changeText(getByPlaceholderText("Enter fat %"), "0"); // invalid fat %
    fireEvent.press(getByText("Calculate"));
    await waitFor(() => {
      expect(getByText("Please input valid fat percentage")).toBeTruthy();
    });
  });

  test("pressing Cancel returns to previous screen", () => {
    const { getByText } = render(<Calories />);
    fireEvent.press(getByText("Cancel"));
    expect(mockBack).toHaveBeenCalled();
  });

  test("toggles mode description when help icon pressed", () => {
    const { getByTestId, queryByText } = render(<Calories />);
    fireEvent.press(getByTestId("mode-help-icon"));
    expect(queryByText(/Two equations are mainly used/)).toBeTruthy();
  });
  test("toggles TDEE and shows PAL section", async () => {
    const { getByText, queryByText } = render(<Calories />);
    fireEvent.press(getByText("Yes")); // Enable TDEE
    await waitFor(() => {
      expect(queryByText(/Activity Level:/)).toBeTruthy();
      expect(queryByText("Select Level")).toBeTruthy();
    });
  });

  test("toggles PAL help icon to show description", () => {
    const { getByTestId, getByText } = render(<Calories />);
    fireEvent.press(getByText("Yes")); // enable TDEE first
    fireEvent.press(getByTestId("pal-help-icon"));
    expect(getByText(/A factor to be multiplied to your BMR/)).toBeTruthy();
  });

  test("disables TDEE again and hides PAL", async () => {
    const { getByText, findByText, queryByText } = render(<Calories />);

    fireEvent.press(getByText("Yes"));
    await findByText("Activity Level: 1");

    fireEvent.press(getByText("No")); // Turn off

    await waitFor(() => {
      expect(queryByText("Activity Level: 1")).toBeNull();
    });
  });

  test("hides results on invalid input after valid BMR", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <Calories />
    );
    fireEvent.changeText(getByPlaceholderText("Enter weight"), "70");
    fireEvent.changeText(getByPlaceholderText("Enter height"), "175");
    fireEvent.changeText(getByPlaceholderText("Enter age"), "25");
    fireEvent.press(getByText("Calculate"));
    await waitFor(() => {
      expect(queryByText(/Your BMR:/)).toBeTruthy();
    });

    // Re-enter with invalid weight
    fireEvent.changeText(getByPlaceholderText("Enter weight"), "0");
    fireEvent.press(getByText("Calculate"));
    await waitFor(() => {
      expect(queryByText(/Your BMR:/)).toBeNull();
    });
  });

  describe("katchBMRCalc", () => {
    test("calculates BMR using body fat % (male)", () => {
      const result = katchBMRCalc(1, 70, 175, 25, 15); // 70kg, 15% fat
      const expectedLBM = 70 * (1 - 0.15); // 59.5
      const expectedBMR = Math.round(370 + 21.6 * expectedLBM);
      expect(result).toBe(expectedBMR);
    });

    test("calculates BMR using formula (male, no fat%)", () => {
      const lbm = 0.407 * 70 + 0.267 * 175 - 19.2;
      const expectedBMR = Math.round(370 + 21.6 * lbm);
      expect(katchBMRCalc(1, 70, 175, 25)).toBe(expectedBMR);
    });

    test("calculates BMR using formula (female, no fat%)", () => {
      const lbm = 0.252 * 55 + 0.473 * 165 - 48.3;
      const expectedBMR = Math.round(370 + 21.6 * lbm);
      expect(katchBMRCalc(0, 55, 165, 30)).toBe(expectedBMR);
    });
  });

  describe("calculateActivityLevel", () => {
    test("returns correct PAL for given work and leisure levels", () => {
      const result = calculateActivityLevel(2, 3);
      const expected = (1.18 + 2 * 0.08 + (0.11 + 2 * 0.01) * 3).toFixed(2);
      expect(result).toBe(expected);
    });

    test("returns base PAL when work and leisure are 0", () => {
      const result = calculateActivityLevel(0, 0);
      expect(result).toBe("1.18");
    });
  });
});
