import { onPostLikeCreate, onPostLikeDelete } from '../../triggers/post-likes';
import { test, mockDocumentSnapshot, cleanup } from '../setup';

// Mock the helpers
jest.mock('../../utils/firestore-helpers', () => ({
  incrementCounter: jest.fn().mockResolvedValue(undefined),
  documentExists: jest.fn().mockResolvedValue(true),
}));

import { incrementCounter, documentExists } from '../../utils/firestore-helpers';

describe('Post Likes Triggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (documentExists as jest.Mock).mockResolvedValue(true);
  });

  afterAll(() => {
    cleanup();
  });

  describe('onPostLikeCreate', () => {
    it('should increment likes counter when like is created', async () => {
      const likeData = {
        postId: 'post123',
        userId: 'user456',
        createdAt: new Date(),
      };

      const snap = mockDocumentSnapshot(likeData, 'like789', 'post-likes');
      const wrapped = test.wrap(onPostLikeCreate);
      
      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('community-posts/post123');
      expect(incrementCounter).toHaveBeenCalledWith(
        'community-posts/post123',
        'likes',
        1
      );
    });

    it('should not increment if postId is missing', async () => {
      const likeData = { userId: 'user456', createdAt: new Date() };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');
      const wrapped = test.wrap(onPostLikeCreate);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should not increment if userId is missing', async () => {
      const likeData = { postId: 'post123', createdAt: new Date() };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');
      const wrapped = test.wrap(onPostLikeCreate);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should not increment if post does not exist', async () => {
      const likeData = {
        postId: 'nonexistent',
        userId: 'user456',
        createdAt: new Date(),
      };

      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');
      (documentExists as jest.Mock).mockResolvedValueOnce(false);

      const wrapped = test.wrap(onPostLikeCreate);
      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('community-posts/nonexistent');
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const likeData = { postId: 'post123', userId: 'user456' };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');

      (documentExists as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));

      const wrapped = test.wrap(onPostLikeCreate);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow('Firestore error');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('onPostLikeDelete', () => {
    it('should decrement likes counter when like is deleted', async () => {
      const likeData = { postId: 'post123', userId: 'user456' };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');
      const wrapped = test.wrap(onPostLikeDelete);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('community-posts/post123');
      expect(incrementCounter).toHaveBeenCalledWith(
        'community-posts/post123',
        'likes',
        -1
      );
    });

    it('should handle missing postId', async () => {
      const likeData = { userId: 'user456' };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');
      const wrapped = test.wrap(onPostLikeDelete);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should handle missing userId', async () => {
      const likeData = { postId: 'post123' };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');
      const wrapped = test.wrap(onPostLikeDelete);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const likeData = { postId: 'post123', userId: 'user456' };
      const snap = mockDocumentSnapshot(likeData, 'test-id', 'post-likes');

      (incrementCounter as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      const wrapped = test.wrap(onPostLikeDelete);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow('Update failed');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

