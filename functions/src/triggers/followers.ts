import * as functions from "firebase-functions";
import {incrementCounter, documentExists} from "../utils/firestore-helpers.js";

/**
 * Cloud Function: Incrementar contadores cuando se crea relación de seguimiento
 * Trigger: onCreate en collection followers
 * Acción:
 *   - Incrementa users/{followerId}.followingCount
 *   - Incrementa users/{followingId}.followersCount
 */
export const onFollowerCreate = functions.firestore
  .document("followers/{followId}")
  .onCreate(async (snap) => {
    try {
      const {followerId, followingId} = snap.data();

      // Validar que followerId y followingId existen
      if (!followerId || !followingId) {
        console.error("Missing followerId or followingId");
        return;
      }

      // Validar que ambos usuarios existen
      const followerExists = await documentExists(`users/${followerId}`);
      const followingExists = await documentExists(`users/${followingId}`);

      if (!followerExists) {
        console.error(`Follower user ${followerId} does not exist`);
        return;
      }

      if (!followingExists) {
        console.error(`Following user ${followingId} does not exist`);
        return;
      }

      // Incrementar followingCount del follower
      await incrementCounter(`users/${followerId}`, "followingCount", 1);

      // Incrementar followersCount del following
      await incrementCounter(`users/${followingId}`, "followersCount", 1);

      console.log(`User ${followerId} followed ${followingId}`);
    } catch (error) {
      console.error("Error in onFollowerCreate:", error);
      throw error;
    }
  });

/**
 * Cloud Function: Decrementar contadores cuando se elimina relación
 * Trigger: onDelete en collection followers
 * Acción:
 *   - Decrementa users/{followerId}.followingCount
 *   - Decrementa users/{followingId}.followersCount
 */
export const onFollowerDelete = functions.firestore
  .document("followers/{followId}")
  .onDelete(async (snap) => {
    try {
      const {followerId, followingId} = snap.data();

      // Validar que followerId y followingId existen
      if (!followerId || !followingId) {
        console.error("Missing followerId or followingId");
        return;
      }

      // Validar que ambos usuarios existen
      const followerExists = await documentExists(`users/${followerId}`);
      const followingExists = await documentExists(`users/${followingId}`);

      if (!followerExists) {
        console.error(`Follower user ${followerId} does not exist`);
        return;
      }

      if (!followingExists) {
        console.error(`Following user ${followingId} does not exist`);
        return;
      }

      // Decrementar followingCount del follower
      await incrementCounter(`users/${followerId}`, "followingCount", -1);

      // Decrementar followersCount del following
      await incrementCounter(`users/${followingId}`, "followersCount", -1);

      console.log(`User ${followerId} unfollowed ${followingId}`);
    } catch (error) {
      console.error("Error in onFollowerDelete:", error);
      throw error;
    }
  });
