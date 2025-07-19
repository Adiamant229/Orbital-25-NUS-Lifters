import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, Text } from "react-native";

import {
  ThemeProvider,
  useThemeContext,
} from "../../components/themedContext"; // Adjust path

// Mock AsyncStorage methods
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Spy on Appearance.getColorScheme (don't mock entire react-native)
jest.spyOn(Appearance, "getColorScheme").mockReturnValue("light");

// Simple test component to consume ThemeContext
const TestComponent = () => {
  const { theme, toggleTheme } = useThemeContext();
  return (
    <>
      <Text testID="theme">{theme}</Text>
      <Text testID="toggle" onPress={toggleTheme}>
        Toggle
      </Text>
    </>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads stored theme from AsyncStorage and uses it", async () => {
  AsyncStorage.getItem.mockResolvedValue("dark");
  Appearance.getColorScheme.mockReturnValue("light");

  const { getByTestId } = render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );

  await waitFor(() => {
    expect(getByTestId("theme").props.children).toBe("dark");
  });

  // Allow setItem to be called but ensure last call is 'dark'
  await waitFor(() => {
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith("user-theme", "dark");
  });
});

  test("falls back to system scheme if no stored theme", async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    Appearance.getColorScheme.mockReturnValue("dark");

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId("theme").props.children).toBe("dark");
    });

    // Should save initial theme to AsyncStorage
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("user-theme", "dark");
    });
  });

  test("toggles theme and persists change", async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    Appearance.getColorScheme.mockReturnValue("light");

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for initial theme to be set
    await waitFor(() => {
      expect(getByTestId("theme").props.children).toBe("light");
    });

    // Toggle theme from light to dark
    await act(async () => {
      getByTestId("toggle").props.onPress();
    });

    expect(getByTestId("theme").props.children).toBe("dark");

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("user-theme", "dark");
    });

    // Toggle theme from dark back to light
    await act(async () => {
      getByTestId("toggle").props.onPress();
    });

    expect(getByTestId("theme").props.children).toBe("light");

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("user-theme", "light");
    });
  });
});
