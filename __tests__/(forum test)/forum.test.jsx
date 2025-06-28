import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import Forum from "../../app/(dashboard)/forum";

jest.mock("../../firebaseConfig", () => ({
  auth: {},
  db: {},
  storage: {},
  app: {},
  functions: {},
}));

jest.mock("firebase/firestore", () => {
  const mockData = {
    title: "Test Thread",
    category: "Training",
    author: "TestUser",
    authorId: "user1",
    content: "This is a test thread",
    createdAt: { toMillis: () => Date.now() },
  };

  return {
    collection: jest.fn(() => []),
    getDoc: jest.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({ name: "TestUser" }),
      })
    ),
    addDoc: jest.fn(() => Promise.resolve({ id: "newThread" })),
    deleteDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    doc: jest.fn(() => ({})),
    query: jest.fn((ref) => ref),
    where: jest.fn(() => {}),
    onSnapshot: jest.fn((ref, callback) => {
      if (Array.isArray(ref)) {
        callback({
          forEach: (fn) => fn({ id: "1", data: () => mockData }),
        });
      }
      else if (ref.id === "1") {
        callback({
          exists: () => true,
          id: "1",
          data: () => mockData,
        });
      }
      else if (
        typeof ref === "object" &&
        ref._path &&
        ref._path.segments?.includes("comments")
      ) {
        callback({
          forEach: (fn) =>
            fn({
              id: "comment1",
              data: () => ({
                commenter: "TestUser",
                commenterID: "user1",
                content: "Test comment",
                createdAt: { toMillis: () => Date.now() },
                editedAt: null,
              }),
            }),
        });
      }

      return jest.fn(); 
    }),
  };
});

jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: { uid: "user1" },
  }),
}));

jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
  const confirm = buttons?.find(
    (btn) =>
      btn.text === "Create" ||
      btn.text === "Save" ||
      btn.text === "Delete" ||
      btn.text === "Post" ||
      btn.text === "Discard"
  );
  if (confirm?.onPress) confirm.onPress();
});

describe("Forum component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders a thread from Firestore", async () => {
    const { getByText } = render(<Forum />);
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());
  });

  test("filters threads by category", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("Training"));
    await waitFor(() => expect(getByText("Test Thread")).toBeTruthy());
  });

  test("opens modal to create thread", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("+"));
    await waitFor(() => expect(getByText("Create New Thread")).toBeTruthy());
  });

  test("alerts if thread is not created with title", async () => {
    const { getByText } = render(<Forum />);
    fireEvent.press(getByText("+"));

    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter a thread title."
    );
  });

  test("alerts if thread is not created with content", async () => {
    const { getByText, getByPlaceholderText } = render(<Forum />);
    fireEvent.press(getByText("+"));
    fireEvent.changeText(getByPlaceholderText("Thread Title"), "New Thread");
    
    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter some content for the thread."
    );
  });

  test("alerts if edited thread has no title", async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(<Forum />);

    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("edit-thread-button"));

    fireEvent.press(getByPlaceholderText("Edit your thread content here...")
    );

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(Alert.alert).toHaveBeenCalledWith("Success", "Thread updated!");
  });

  test("creates a thread with valid input", async () => {
    const { getByText, getByPlaceholderText } = render(<Forum />);
    fireEvent.press(getByText("+"));
    fireEvent.changeText(getByPlaceholderText("Thread Title"), "New Thread");
    fireEvent.changeText(
      getByPlaceholderText("Write your thread content here..."),
      "New Content"
    );

    await act(async () => {
      fireEvent.press(getByText("Create"));
    });

    expect(Alert.alert).toHaveBeenCalledWith("Success", "Thread created!");
  });

  test("editing a thread updates Firestore", async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(<Forum />);

    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("edit-thread-button"));

    fireEvent.changeText(
      getByPlaceholderText("Edit your thread content here..."),
      "Updated content"
    );

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(Alert.alert).toHaveBeenCalledWith("Success", "Thread updated!");
  });

  test("cancelling edit with changes prompts confirmation", async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<Forum />);

    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("edit-thread-button"));

    fireEvent.changeText(
      getByPlaceholderText("Edit your thread content here..."),
      "Changed!"
    );

    await act(async () => {
      fireEvent.press(getByText("Cancel"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Discard Changes?",
      expect.any(String),
      expect.any(Array)
    );
  });

  
  test("alerts is edited thread has no title", async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<Forum />);

    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("edit-thread-button"));

    fireEvent.changeText(
      getByPlaceholderText("Thread Title"),
      ""
    );

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter a thread title."
    );
  });

  test("alerts is edited thread has no content", async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<Forum />);

    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("edit-thread-button"));

    fireEvent.changeText(
      getByPlaceholderText("Edit your thread content here..."),
      ""
    );

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please enter some content for the thread."
    );
  });

  test("deletes a thread", async () => {
    const { getByText, getByTestId } = render(<Forum />);
    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("delete-thread-button")); 

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Thread",
      "Are you sure you want to delete this thread?",
      expect.any(Array)
    );
  });

  test("opens thread detail modal and posts a comment", async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(<Forum />);

    await waitFor(() => getByText("Test Thread"));

    fireEvent.press(getByTestId("thread-card-button"));

    fireEvent.changeText(getByPlaceholderText("Add a comment..."), "Changed!");
    
    fireEvent.press(getByText("Post"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Confirm Post",
      "Do you really want to post this comment?",
      expect.any(Array),
      { cancelable: true }
    );
  });

  test("alerts if user wants to post empty comment", async () => {
    const { getByText, getByTestId, getByPlaceholderText, findByText } = render(<Forum />);
  
    await waitFor(() => getByText("Test Thread"));
  
    fireEvent.press(getByTestId("thread-card-button"));
  
    fireEvent.press(getByPlaceholderText("Add a comment..."));
  
    fireEvent.press(getByText("Post"));

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Please enter a comment");

  });
  
});
