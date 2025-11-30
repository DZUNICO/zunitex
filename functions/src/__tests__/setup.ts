import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';

// Initialize test environment
export const test = functionsTest(
  {
    projectId: 'test-project',
  },
  undefined
);

// Mock Firestore
export const mockFirestore = () => {
  const db = admin.firestore();
  
  // Mock FieldValue for testing
  (admin.firestore.FieldValue as any).increment = (value: number) => ({
    _methodName: 'FieldValue.increment',
    _value: value,
  });
  
  return db;
};

// Helper to create mock document snapshot using firebase-functions-test
export const mockDocumentSnapshot = (data: any, id: string = 'test-id', collectionPath: string = 'test-collection') => {
  return test.firestore.makeDocumentSnapshot(data, `${collectionPath}/${id}`);
};

// Helper to create mock change snapshot (for onUpdate)
export const mockChangeSnapshot = (beforeData: any, afterData: any, id: string = 'test-id', collectionPath: string = 'test-collection') => {
  return test.firestore.makeDocumentSnapshot(afterData, `${collectionPath}/${id}`);
};

// Helper to create Change object for onUpdate triggers
export const mockChange = (beforeData: any, afterData: any, id: string = 'test-id', collectionPath: string = 'test-collection') => {
  const before = test.firestore.makeDocumentSnapshot(beforeData, `${collectionPath}/${id}`);
  const after = test.firestore.makeDocumentSnapshot(afterData, `${collectionPath}/${id}`);
  return { before, after };
};

// Cleanup after tests
export const cleanup = () => {
  test.cleanup();
};

