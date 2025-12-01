import {
  onResourceLikeCreate,
  onResourceLikeDelete,
} from "../../triggers/resource-likes";
import {test, mockDocumentSnapshot, cleanup} from "../setup";

// Mock the helpers
jest.mock("../../utils/firestore-helpers", () => ({
  incrementCounter: jest.fn().mockResolvedValue(undefined),
  documentExists: jest.fn().mockResolvedValue(true),
}));

import {incrementCounter, documentExists} from "../../utils/firestore-helpers";

describe("Resource Likes Triggers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (documentExists as jest.Mock).mockResolvedValue(true);
  });

  afterAll(() => {
    cleanup();
  });

  describe("onResourceLikeCreate", () => {
    it("should increment likes counter when like is created", async () => {
      const likeData = {
        resourceId: "resource123",
        userId: "user456",
        createdAt: new Date(),
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      const wrapped = test.wrap(onResourceLikeCreate);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith("resources/resource123");
      expect(incrementCounter).toHaveBeenCalledWith(
        "resources/resource123",
        "likes",
        1
      );
    });

    it("should not increment if resource does not exist", async () => {
      const likeData = {
        resourceId: "nonexistent",
        userId: "user456",
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      (documentExists as jest.Mock).mockResolvedValueOnce(false);

      const wrapped = test.wrap(onResourceLikeCreate);
      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith("resources/nonexistent");
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should not increment if resourceId is missing", async () => {
      const likeData = {userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      const wrapped = test.wrap(onResourceLikeCreate);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should not increment if userId is missing", async () => {
      const likeData = {resourceId: "resource123"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      const wrapped = test.wrap(onResourceLikeCreate);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should handle errors during update", async () => {
      const likeData = {
        resourceId: "resource123",
        userId: "user456",
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      (incrementCounter as jest.Mock).mockRejectedValueOnce(
        new Error("Update failed")
      );

      const wrapped = test.wrap(onResourceLikeCreate);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow("Update failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("onResourceLikeDelete", () => {
    it("should decrement likes counter when like is deleted", async () => {
      const likeData = {
        resourceId: "resource123",
        userId: "user456",
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      const wrapped = test.wrap(onResourceLikeDelete);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith("resources/resource123");
      expect(incrementCounter).toHaveBeenCalledWith(
        "resources/resource123",
        "likes",
        -1
      );
    });

    it("should handle missing resourceId", async () => {
      const likeData = {userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      const wrapped = test.wrap(onResourceLikeDelete);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should handle missing userId", async () => {
      const likeData = {resourceId: "resource123"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      const wrapped = test.wrap(onResourceLikeDelete);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should handle errors during decrement", async () => {
      const likeData = {
        resourceId: "resource123",
        userId: "user456",
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "resource-likes");
      (incrementCounter as jest.Mock).mockRejectedValueOnce(
        new Error("Decrement failed")
      );

      const wrapped = test.wrap(onResourceLikeDelete);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow("Decrement failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

