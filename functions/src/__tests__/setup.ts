/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from "firebase-admin";
import functionsTest from "firebase-functions-test";

// Initialize test environment
export const test = functionsTest(
  {
    projectId: "test-project",
  },
  undefined
);

// Mock Firestore
export const mockFirestore = () => {
  const db = admin.firestore();

  // Mock FieldValue for testing
  (admin.firestore.FieldValue as unknown as {
    increment: (value: number) => {_methodName: string; _value: number};
  }).increment = (value: number) => ({
    _methodName: "FieldValue.increment",
    _value: value,
  });

  return db;
};

// Helper to create mock document snapshot using firebase-functions-test
export const mockDocumentSnapshot = (
  data: unknown,
  id: string = "test-id",
  collectionPath: string = "test-collection"
) => {
  return test.firestore.makeDocumentSnapshot(
    data as {[key: string]: any},
    `${collectionPath}/${id}`
  );
};

// Helper to create mock change snapshot (for onUpdate)
export const mockChangeSnapshot = (
  beforeData: unknown,
  afterData: unknown,
  id: string = "test-id",
  collectionPath: string = "test-collection"
) => {
  return test.firestore.makeDocumentSnapshot(
    afterData as {[key: string]: any},
    `${collectionPath}/${id}`
  );
};

// Helper to create Change object for onUpdate triggers
export const mockChange = (
  beforeData: unknown,
  afterData: unknown,
  id: string = "test-id",
  collectionPath: string = "test-collection"
) => {
  const before = test.firestore.makeDocumentSnapshot(
    beforeData as {[key: string]: any},
    `${collectionPath}/${id}`
  );
  const after = test.firestore.makeDocumentSnapshot(
    afterData as {[key: string]: any},
    `${collectionPath}/${id}`
  );
  return {before, after};
};

// Cleanup after tests
export const cleanup = () => {
  test.cleanup();
};

// Mock de Custom Claims
export const mockCustomClaims = {
  admin: {role: "admin", admin: true},
  moderator: {role: "moderator", admin: false},
  verified_seller: {role: "verified_seller", admin: false},
  user: {role: "user", admin: false},
};

