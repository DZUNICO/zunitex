import {onBlogLikeCreate, onBlogLikeDelete} from "../../triggers/blog-likes";
import {test, mockDocumentSnapshot, cleanup} from "../setup";

// Mock the helpers
jest.mock("../../utils/firestore-helpers", () => ({
  incrementCounter: jest.fn().mockResolvedValue(undefined),
  documentExists: jest.fn().mockResolvedValue(true),
}));

import {incrementCounter, documentExists} from "../../utils/firestore-helpers";

describe("Blog Likes Triggers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (documentExists as jest.Mock).mockResolvedValue(true);
  });

  afterAll(() => {
    cleanup();
  });

  describe("onBlogLikeCreate", () => {
    it("should increment likesCount when blog like is created", async () => {
      const likeData = {
        postId: "blog123",
        userId: "user456",
        createdAt: new Date(),
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      const wrapped = test.wrap(onBlogLikeCreate);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith("blog-posts/blog123");
      expect(incrementCounter).toHaveBeenCalledWith(
        "blog-posts/blog123",
        "likesCount",
        1
      );
    });

    it("should not increment if blog post does not exist", async () => {
      const likeData = {postId: "nonexistent", userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      (documentExists as jest.Mock).mockResolvedValueOnce(false);

      const wrapped = test.wrap(onBlogLikeCreate);
      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith("blog-posts/nonexistent");
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should not increment if postId is missing", async () => {
      const likeData = {userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      const wrapped = test.wrap(onBlogLikeCreate);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should not increment if userId is missing", async () => {
      const likeData = {postId: "blog123"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      const wrapped = test.wrap(onBlogLikeCreate);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should handle errors during update", async () => {
      const likeData = {
        postId: "blog123",
        userId: "user456",
      };

      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      (incrementCounter as jest.Mock).mockRejectedValueOnce(
        new Error("Update failed")
      );

      const wrapped = test.wrap(onBlogLikeCreate);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow("Update failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("onBlogLikeDelete", () => {
    it("should decrement likesCount when blog like is deleted", async () => {
      const likeData = {postId: "blog123", userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      const wrapped = test.wrap(onBlogLikeDelete);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith("blog-posts/blog123");
      expect(incrementCounter).toHaveBeenCalledWith(
        "blog-posts/blog123",
        "likesCount",
        -1
      );
    });

    it("should handle missing data fields", async () => {
      const likeData = {userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      const wrapped = test.wrap(onBlogLikeDelete);

      await wrapped(snap);

      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it("should handle errors in decrement", async () => {
      const likeData = {postId: "blog123", userId: "user456"};
      const snap = mockDocumentSnapshot(likeData, "test-id", "blog-likes");
      (incrementCounter as jest.Mock).mockRejectedValueOnce(
        new Error("Update failed")
      );

      const wrapped = test.wrap(onBlogLikeDelete);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow("Update failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

