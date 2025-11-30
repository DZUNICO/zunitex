import { onFollowerCreate, onFollowerDelete } from '../../triggers/followers';
import { test, mockDocumentSnapshot, cleanup } from '../setup';

// Mock the helpers
jest.mock('../../utils/firestore-helpers', () => ({
  incrementCounter: jest.fn().mockResolvedValue(undefined),
  documentExists: jest.fn().mockResolvedValue(true),
}));

import { incrementCounter, documentExists } from '../../utils/firestore-helpers';

describe('Followers Triggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (documentExists as jest.Mock).mockResolvedValue(true);
  });

  afterAll(() => {
    cleanup();
  });

  describe('onFollowerCreate', () => {
    it('should increment both followingCount and followersCount', async () => {
      const followerData = {
        followerId: 'user123',
        followingId: 'user456',
        followerName: 'John Doe',
        followingName: 'Jane Doe',
        createdAt: new Date(),
      };

      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      const wrapped = test.wrap(onFollowerCreate);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('users/user123');
      expect(documentExists).toHaveBeenCalledWith('users/user456');
      
      expect(incrementCounter).toHaveBeenCalledWith(
        'users/user123',
        'followingCount',
        1
      );
      
      expect(incrementCounter).toHaveBeenCalledWith(
        'users/user456',
        'followersCount',
        1
      );
    });

    it('should not update if followerId is missing', async () => {
      const followerData = { followingId: 'user456' };
      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      const wrapped = test.wrap(onFollowerCreate);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should not update if followingId is missing', async () => {
      const followerData = { followerId: 'user123' };
      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      const wrapped = test.wrap(onFollowerCreate);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should not update if follower does not exist', async () => {
      const followerData = {
        followerId: 'user123',
        followingId: 'user456',
      };

      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      (documentExists as jest.Mock)
        .mockResolvedValueOnce(false) // follower doesn't exist
        .mockResolvedValueOnce(true);  // following exists

      const wrapped = test.wrap(onFollowerCreate);
      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('users/user123');
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should not update if following does not exist', async () => {
      const followerData = {
        followerId: 'user123',
        followingId: 'user456',
      };

      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      (documentExists as jest.Mock)
        .mockResolvedValueOnce(true)   // follower exists
        .mockResolvedValueOnce(false);  // following doesn't exist

      const wrapped = test.wrap(onFollowerCreate);
      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('users/user123');
      expect(documentExists).toHaveBeenCalledWith('users/user456');
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const followerData = {
        followerId: 'user123',
        followingId: 'user456',
      };

      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      (incrementCounter as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      const wrapped = test.wrap(onFollowerCreate);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow('Update failed');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('onFollowerDelete', () => {
    it('should decrement both followingCount and followersCount', async () => {
      const followerData = {
        followerId: 'user123',
        followingId: 'user456',
      };

      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      const wrapped = test.wrap(onFollowerDelete);

      await wrapped(snap);

      expect(documentExists).toHaveBeenCalledWith('users/user123');
      expect(documentExists).toHaveBeenCalledWith('users/user456');
      
      expect(incrementCounter).toHaveBeenCalledWith(
        'users/user123',
        'followingCount',
        -1
      );
      
      expect(incrementCounter).toHaveBeenCalledWith(
        'users/user456',
        'followersCount',
        -1
      );
    });

    it('should handle missing followerId', async () => {
      const followerData = { followingId: 'user456' };
      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      const wrapped = test.wrap(onFollowerDelete);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should handle missing followingId', async () => {
      const followerData = { followerId: 'user123' };
      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      const wrapped = test.wrap(onFollowerDelete);

      await wrapped(snap);
      
      expect(documentExists).not.toHaveBeenCalled();
      expect(incrementCounter).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const followerData = {
        followerId: 'user123',
        followingId: 'user456',
      };

      const snap = mockDocumentSnapshot(followerData, 'test-id', 'followers');
      (incrementCounter as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      const wrapped = test.wrap(onFollowerDelete);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(wrapped(snap)).rejects.toThrow('Update failed');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

