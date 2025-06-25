import { render, waitFor, fireEvent, act } from "@testing-library/react-native";

const fetchMock = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        timestamp: { _seconds: 1719300000 },
        gym_capacity: [
          {}, // index 0 unused
          { name: "USC", capacity: 35, maxCapacity: 50 },
          { name: "UTown", capacity: 100, maxCapacity: 120 },
        ],
      }),
  })
);

// Mock safe-area context for test compatibility
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => <>{children}</>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock expo-router with push mock
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const GymCapacity = require("../../app/(dashboard)/gymCapacity").default;

describe("GymCapacity Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockClear();
    mockPush.mockClear();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("renders correctly and fetches gym data", async () => {
    const { getAllByText, queryByText, getByText } = render(<GymCapacity />);

    expect(getAllByText(/Loading/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(queryByText(/Loading/i)).toBeNull();
      expect(getByText("UTown Gym: 100")).toBeTruthy();
      expect(getByText("USC Gym: 35")).toBeTruthy();
    });
  });

  test("displays the last updated timestamp", async () => {
    const { findByTestId } = render(<GymCapacity />);
    const timestamp = await findByTestId("last-updated");
    const textContent = Array.isArray(timestamp.props.children)
      ? timestamp.props.children.join("")
      : timestamp.props.children;

    expect(textContent).toMatch(/Last updated/);
  });

  test("clicking UTown button navigates to /utownReports", async () => {
    const { getByText } = render(<GymCapacity />);
    await waitFor(() => getByText("UTown Gym: 100"));

    fireEvent.press(getByText(/UTown Gym/i));
    expect(mockPush).toHaveBeenCalledWith("/utownReports");
  });

  test("clicking USC button navigates to /uscReports", async () => {
    const { getByText } = render(<GymCapacity />);
    await waitFor(() => getByText("USC Gym: 35"));

    fireEvent.press(getByText(/USC Gym/i));
    expect(mockPush).toHaveBeenCalledWith("/uscReports");
  });

});
