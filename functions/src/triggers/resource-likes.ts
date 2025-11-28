import * as functions from "firebase-functions";
import {incrementCounter, documentExists} from "../utils/firestore-helpers.js";

/**
 * Cloud Function: Incrementar contador de likes cuando se crea documento
 * Trigger: onCreate en collection resource-likes
 * Acción: Incrementa resources/{resourceId}.likes
 */
export const onResourceLikeCreate = functions.firestore
  .document("resource-likes/{likeId}")
  .onCreate(async (snap) => {
    try {
      const {resourceId, userId} = snap.data();

      // Validar que resourceId y userId existen
      if (!resourceId || !userId) {
        console.error("Missing resourceId or userId in resource like data");
        return;
      }

      // Validar que el resource existe
      const resourceExists = await documentExists(`resources/${resourceId}`);
      if (!resourceExists) {
        console.error(`Resource ${resourceId} does not exist`);
        return;
      }

      // Incrementar contador de likes de forma ATÓMICA
      await incrementCounter(`resources/${resourceId}`, "likes", 1);

      console.log(`Like added to resource ${resourceId} by user ${userId}`);
    } catch (error) {
      console.error("Error in onResourceLikeCreate:", error);
      throw error;
    }
  });

/**
 * Cloud Function: Decrementar contador de likes cuando se elimina documento
 * Trigger: onDelete en collection resource-likes
 * Acción: Decrementa resources/{resourceId}.likes
 */
export const onResourceLikeDelete = functions.firestore
  .document("resource-likes/{likeId}")
  .onDelete(async (snap) => {
    try {
      const {resourceId, userId} = snap.data();

      // Validar que resourceId y userId existen
      if (!resourceId || !userId) {
        console.error("Missing resourceId or userId in resource like data");
        return;
      }

      // Validar que el resource existe
      const resourceExists = await documentExists(`resources/${resourceId}`);
      if (!resourceExists) {
        console.error(`Resource ${resourceId} does not exist for unlike`);
        return;
      }

      // Decrementar contador de likes de forma ATÓMICA
      await incrementCounter(`resources/${resourceId}`, "likes", -1);

      console.log(`Like removed from resource ${resourceId} by user ${userId}`);
    } catch (error) {
      console.error("Error in onResourceLikeDelete:", error);
      throw error;
    }
  });
