import {
  onReviewCreate,
  onReviewUpdate,
  onReviewDelete,
} from "../../triggers/reviews";
import {test, mockDocumentSnapshot, mockChange, cleanup} from "../setup";

// Mock del módulo config
jest.mock("../../config", () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn().mockResolvedValue({}),
  },
}));

// Importar el módulo mockeado para acceder al mock
import {db} from "../../config";

// Cast db para poder acceder a los métodos mockeados
const mockDb = db as unknown as {
  collection: jest.Mock;
  doc: jest.Mock;
  where: jest.Mock;
  get: jest.Mock;
  set: jest.Mock;
};

describe("Reviews Triggers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar los mocks para que retornen this
    mockDb.collection.mockReturnValue(mockDb);
    mockDb.doc.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
  });

  afterAll(() => {
    cleanup();
  });

  describe("onReviewCreate", () => {
    it("should calculate average when first review is created", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        reviewerId: "user456",
        rating: 5,
        comment: "Excellent work!",
        category: "technical",
        createdAt: new Date(),
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");

      mockDb.get.mockResolvedValueOnce({
        empty: false,
        forEach: (callback: (...args: unknown[]) => void) => {
          callback({data: () => ({rating: 5})});
        },
      });

      const wrapped = test.wrap(onReviewCreate);
      await wrapped(snap);

      expect(mockDb.collection).toHaveBeenCalledWith("reviews");
      expect(mockDb.where).toHaveBeenCalledWith(
        "reviewedUserId",
        "==",
        "user123"
      );
      expect(mockDb.collection).toHaveBeenCalledWith("user-ratings");
      expect(mockDb.doc).toHaveBeenCalledWith("user123");
      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 5,
          totalReviews: 1,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should calculate average of multiple reviews", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 4,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");

      mockDb.get.mockResolvedValueOnce({
        empty: false,
        forEach: (callback: (...args: unknown[]) => void) => {
          callback({data: () => ({rating: 5})});
          callback({data: () => ({rating: 4})});
          callback({data: () => ({rating: 3})});
        },
      });

      const wrapped = test.wrap(onReviewCreate);
      await wrapped(snap);

      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 4,
          totalReviews: 3,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should handle no reviews case", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 5,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");
      mockDb.get.mockResolvedValueOnce({empty: true});

      const wrapped = test.wrap(onReviewCreate);
      await wrapped(snap);

      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 0,
          totalReviews: 0,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should round average rating to 1 decimal", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 4,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");

      mockDb.get.mockResolvedValueOnce({
        empty: false,
        forEach: (callback: (...args: unknown[]) => void) => {
          callback({data: () => ({rating: 5})});
          callback({data: () => ({rating: 4})});
          callback({data: () => ({rating: 4})});
        },
      });

      const wrapped = test.wrap(onReviewCreate);
      await wrapped(snap);

      // (5 + 4 + 4) / 3 = 4.333... rounded to 4.3
      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 4.3,
          totalReviews: 3,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should handle missing reviewedUserId", async () => {
      const reviewData = {
        reviewerId: "user456",
        rating: 5,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");
      const wrapped = test.wrap(onReviewCreate);

      await wrapped(snap);

      expect(mockDb.collection).not.toHaveBeenCalled();
      expect(mockDb.set).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 5,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");
      mockDb.get.mockRejectedValueOnce(new Error("Query failed"));

      const wrapped = test.wrap(onReviewCreate);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow("Query failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("onReviewUpdate", () => {
    it("should recalculate average when review is updated", async () => {
      const change = mockChange(
        {rating: 3, reviewedUserId: "user123"},
        {rating: 5, reviewedUserId: "user123"},
        "review123",
        "reviews"
      );

      mockDb.get.mockResolvedValueOnce({
        empty: false,
        forEach: (callback: (...args: unknown[]) => void) => {
          callback({data: () => ({rating: 5})});
          callback({data: () => ({rating: 4})});
        },
      });

      const wrapped = test.wrap(onReviewUpdate);
      await wrapped(change);

      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 4.5,
          totalReviews: 2,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should handle missing reviewedUserId", async () => {
      const change = mockChange(
        {rating: 3},
        {rating: 5},
        "review123",
        "reviews"
      );

      const wrapped = test.wrap(onReviewUpdate);
      await wrapped(change);

      expect(mockDb.set).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const change = mockChange(
        {rating: 3, reviewedUserId: "user123"},
        {rating: 5, reviewedUserId: "user123"},
        "review123",
        "reviews"
      );

      mockDb.get.mockRejectedValueOnce(new Error("Query failed"));

      const wrapped = test.wrap(onReviewUpdate);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(change)).rejects.toThrow("Query failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("onReviewDelete", () => {
    it("should recalculate average when review is deleted", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 2,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");

      mockDb.get.mockResolvedValueOnce({
        empty: false,
        forEach: (callback: (...args: unknown[]) => void) => {
          callback({data: () => ({rating: 5})});
          callback({data: () => ({rating: 4})});
        },
      });

      const wrapped = test.wrap(onReviewDelete);
      await wrapped(snap);

      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 4.5,
          totalReviews: 2,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should set rating to 0 when last review is deleted", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 5,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");
      mockDb.get.mockResolvedValueOnce({empty: true});

      const wrapped = test.wrap(onReviewDelete);
      await wrapped(snap);

      expect(mockDb.set).toHaveBeenCalledWith(
        {
          averageRating: 0,
          totalReviews: 0,
          updatedAt: expect.anything(),
        },
        {merge: true}
      );
    });

    it("should handle missing reviewedUserId", async () => {
      const reviewData = {
        reviewerId: "user456",
        rating: 5,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");
      const wrapped = test.wrap(onReviewDelete);

      await wrapped(snap);

      expect(mockDb.collection).not.toHaveBeenCalled();
      expect(mockDb.set).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const reviewData = {
        reviewedUserId: "user123",
        rating: 5,
      };

      const snap = mockDocumentSnapshot(reviewData, "test-id", "reviews");
      mockDb.get.mockRejectedValueOnce(new Error("Query failed"));

      const wrapped = test.wrap(onReviewDelete);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow("Query failed");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

