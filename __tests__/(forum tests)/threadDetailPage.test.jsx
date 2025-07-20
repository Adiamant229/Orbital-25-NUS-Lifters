import { Alert } from "react-native";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import ThreadDetailPage from "../../app/(forum)/[threadId]";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ threadId: "testThreadId" }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock("../../firebaseConfig", () => ({
  db: {},
}));

const mockCurrentUser = { uid: "user123" };
jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: mockCurrentUser,
  }),
}));

const mockDoc = jest.fn((dbArg, ...pathSegments) => pathSegments.join("/"));
const mockCollection = jest.fn((dbArg, ...pathSegments) =>
  pathSegments.join("/")
);
const mockOnSnapshot = jest.fn();
const mockUpdateDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  addDoc: (...args) => mockAddDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
}));

jest.mock("expo-av", () => ({
  Video: ({ ...props }) => {
    return <></>;
  },
}));

jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
  const confirmButton =
    buttons.find((btn) => btn.style !== "cancel") || buttons[0];
  if (confirmButton && confirmButton.onPress) {
    confirmButton.onPress();
  }
});

describe("ThreadDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders thread with author as current user and comment by John Doe", async () => {
    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Test Thread",
            content: "Test content goes here",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date("2024-01-01") },
            likes: 3,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({
          docs: [
            {
              id: "comment1",
              data: () => ({
                commenterID: "otherUserId",
                content: "Test comment",
                createdAt: { toMillis: () => 1000, toDate: () => new Date() },
                editedAt: null,
                likes: 2,
                likedBy: [],
              }),
            },
          ],
        });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({
              id: "user123",
              data: () => ({ name: "Current User" }),
            });
            cb({
              id: "otherUserId",
              data: () => ({ name: "John Doe" }),
            });
          },
        });
      }
      return jest.fn();
    });

    const { getByText } = render(<ThreadDetailPage />);

    await waitFor(() => {
      expect(getByText("Test Thread")).toBeTruthy();
      expect(getByText("Test content goes here")).toBeTruthy();
      expect(getByText("- Test comment")).toBeTruthy();
      expect(getByText("You")).toBeTruthy();
      expect(getByText("John Doe")).toBeTruthy();
    });
  });

  test("renders likes and toggles heart icon", async () => {
    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Like Test",
            content: "Liking thread...",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date("2024-01-01") },
            likes: 1,
            likedBy: ["user123"],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByText } = render(<ThreadDetailPage />);

    await waitFor(() => {
      expect(getByText("Like Test")).toBeTruthy();
      expect(getByText("1")).toBeTruthy();
    });
  });

  test("displays 'No comments yet' when comments list is empty", async () => {
    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Empty Comments",
            content: "No one commented yet.",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date("2024-01-01") },
            likes: 0,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByText } = render(<ThreadDetailPage />);
    await waitFor(() => {
      expect(getByText('No comments yet. Press "+" to add one!')).toBeTruthy();
    });
  });

  test("renders edited comment with (edited) label", async () => {
    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Edited Comment Thread",
            content: "Content",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date("2024-01-01") },
            likes: 0,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({
          docs: [
            {
              id: "c1",
              data: () => ({
                commenterID: "user123",
                content: "Edited comment",
                createdAt: {
                  toMillis: () => Date.now(),
                  toDate: () => new Date(),
                },
                editedAt: new Date(),
                likes: 0,
                likedBy: [],
              }),
            },
          ],
        });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByText, queryByText } = render(<ThreadDetailPage />);
    await waitFor(() => {
      expect(getByText("- Edited comment")).toBeTruthy();

      const editedLabel = queryByText(/\(edited\)/);
      expect(editedLabel).toBeTruthy();
    });
  });

  test("shows alert when submitting empty comment", async () => {
    const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const { getByText, getByTestId, getByPlaceholderText } = render(
      <ThreadDetailPage />
    );

    await waitFor(() => getByTestId("addCommentButton"));
    fireEvent.press(getByTestId("addCommentButton"));

    fireEvent.changeText(
      getByPlaceholderText("Write your comment here..."),
      "   "
    );
    fireEvent.press(getByText("Post"));

    expect(mockAlert).toHaveBeenCalledWith("Error", "Comment cannot be empty.");

    mockAlert.mockRestore();
  });

  test("shows discard changes alert if editing with unsaved changes", async () => {
    const mockAlert = jest.spyOn(Alert, "alert");
    const { getByText, getByTestId, getByPlaceholderText } = render(
      <ThreadDetailPage />
    );

    await waitFor(() => getByTestId("addCommentButton"));
    fireEvent.press(getByTestId("addCommentButton"));

    fireEvent.changeText(
      getByPlaceholderText("Write your comment here..."),
      "unsaved"
    );

    fireEvent.press(getByText("Cancel"));

    expect(mockAlert).toHaveBeenCalledWith(
      "Discard changes?",
      "You have unsaved changes.",
      expect.any(Array)
    );
  });

  test("toggleCommentLike updates comment like count", async () => {
    mockUpdateDoc.mockResolvedValueOnce();

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Thread",
            content: "Post",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date() },
            likes: 0,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({
          docs: [
            {
              id: "c123",
              data: () => ({
                commenterID: "user123",
                content: "Nice comment!",
                createdAt: {
                  toMillis: () => Date.now(),
                  toDate: () => new Date(),
                },
                editedAt: null,
                likes: 2,
                likedBy: [],
              }),
            },
          ],
        });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByTestId } = render(<ThreadDetailPage />);

    await waitFor(() => {
      expect(getByTestId("comment-like-button-c123")).toBeTruthy();
    });

    fireEvent.press(getByTestId("comment-like-button-c123"));

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        "threads/testThreadId/comments/c123",
        {
          likes: 3,
          likedBy: ["user123"],
        }
      );
    });
  });

  test("toggle thread like adds current user to likedBy and increments likes", async () => {
    mockUpdateDoc.mockResolvedValueOnce();

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Like Thread Test",
            content: "Content",
            authorId: "otherUser",
            category: "General",
            createdAt: { toDate: () => new Date() },
            likes: 1,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByTestId } = render(<ThreadDetailPage />);

    await waitFor(() => expect(getByTestId("thread-like-button")).toBeTruthy());

    fireEvent.press(getByTestId("thread-like-button"));

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        "threads/testThreadId",
        expect.objectContaining({
          likes: 2,
          likedBy: expect.arrayContaining(["user123"]),
        })
      );
    });
  });

  test("toggle thread like removes current user from likedBy and decrements likes", async () => {
    mockUpdateDoc.mockResolvedValueOnce();

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Unlike Thread Test",
            content: "Content",
            authorId: "otherUser",
            category: "General",
            createdAt: { toDate: () => new Date() },
            likes: 2,
            likedBy: ["user123"],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByTestId } = render(<ThreadDetailPage />);

    await waitFor(() => expect(getByTestId("thread-like-button")).toBeTruthy());

    fireEvent.press(getByTestId("thread-like-button"));

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        "threads/testThreadId",
        expect.objectContaining({
          likes: 1,
          likedBy: expect.not.arrayContaining(["user123"]),
        })
      );
    });
  });

  test("successfully adds a comment and closes modal", async () => {
    mockAddDoc.mockResolvedValueOnce();

    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const confirmButton = buttons.find(
        (button) => button.text === "Post" || button.text === "Save"
      );
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    });

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Add Comment Test",
            content: "Content",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date() },
            likes: 0,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByTestId, getByText, getByPlaceholderText, queryByTestId } =
      render(<ThreadDetailPage />);

    await waitFor(() => getByTestId("addCommentButton"));

    fireEvent.press(getByTestId("addCommentButton"));

    fireEvent.changeText(
      getByPlaceholderText("Write your comment here..."),
      "New comment"
    );

    fireEvent.press(getByText("Post"));

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(queryByTestId("add-comment-modal")).toBeNull();
    });
  });

  test("cancel adding comment with no changes closes modal without alert", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Cancel Comment Test",
            content: "Content",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date() },
            likes: 0,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByTestId, getByText, queryByTestId } = render(
      <ThreadDetailPage />
    );

    await waitFor(() => getByTestId("addCommentButton"));

    fireEvent.press(getByTestId("addCommentButton"));

    fireEvent.press(getByText("Cancel"));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(queryByTestId("add-comment-modal")).toBeNull();

    alertSpy.mockRestore();
  });

  test("shows confirmation alert and deletes comment when confirmed", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, msg, buttons) => {
        const deleteButton = buttons.find((b) => b.text === "Delete");
        if (deleteButton && deleteButton.onPress) {
          deleteButton.onPress();
        }
      });

    mockDeleteDoc.mockResolvedValueOnce();

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => true,
          id: "testThreadId",
          data: () => ({
            title: "Delete Comment Test",
            content: "Content",
            authorId: "user123",
            category: "General",
            createdAt: { toDate: () => new Date() },
            likes: 0,
            likedBy: [],
          }),
        });
      } else if (ref.includes("comments")) {
        callback({
          docs: [
            {
              id: "commentDel",
              data: () => ({
                commenterID: "user123",
                content: "Comment to delete",
                createdAt: {
                  toMillis: () => Date.now(),
                  toDate: () => new Date(),
                },
                editedAt: null,
                likes: 0,
                likedBy: [],
              }),
            },
          ],
        });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {
            cb({ id: "user123", data: () => ({ name: "You" }) });
          },
        });
      }
      return jest.fn();
    });

    const { getByTestId } = render(<ThreadDetailPage />);

    await waitFor(() => getByTestId("delete-comment-button-commentDel"));

    fireEvent.press(getByTestId("delete-comment-button-commentDel"));

    expect(alertSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledWith(
        "threads/testThreadId/comments/commentDel"
      );
    });

    alertSpy.mockRestore();
  });

  test("shows 'Thread not found' alert if thread does not exist", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    mockOnSnapshot.mockImplementation((ref, callback) => {
      if (ref.includes("threads/testThreadId") && !ref.includes("comments")) {
        callback({
          exists: () => false,
        });
      } else if (ref.includes("comments")) {
        callback({ docs: [] });
      } else if (ref.includes("users")) {
        callback({
          forEach: (cb) => {},
        });
      }
      return jest.fn();
    });

    render(<ThreadDetailPage />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Thread not found");
    });

    alertSpy.mockRestore();
  });
});
