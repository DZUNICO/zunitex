import * as functions from "firebase-functions";
import {incrementCounter, documentExists} from "../utils/firestore-helpers.js";

/**
 * Cloud Function: Incrementar contador de likes cuando se crea documento
 * Trigger: onCreate en collection post-likes
 * Acción: Incrementa community-posts/{postId}.likes
 */
export const onPostLikeCreate = functions.firestore
  .document("post-likes/{likeId}")
  .onCreate(async (snap) => {
    try {
      const {postId, userId} = snap.data();

      // Validar que postId y userId existen
      if (!postId || !userId) {
        console.error("Missing postId or userId in like data");
        return;
      }

      // Validar que el post existe
      const postExists = await documentExists(`community-posts/${postId}`);
      if (!postExists) {
        console.error(`Post ${postId} does not exist`);
        return;
      }

      // Incrementar contador de likes de forma ATÓMICA
      await incrementCounter(`community-posts/${postId}`, "likes", 1);

      console.log(`Like added to post ${postId} by user ${userId}`);
    } catch (error) {
      console.error("Error in onPostLikeCreate:", error);
      throw error;
    }
  });

/**
 * Cloud Function: Decrementar contador de likes cuando se elimina documento
 * Trigger: onDelete en collection post-likes
 * Acción: Decrementa community-posts/{postId}.likes
 */
export const onPostLikeDelete = functions.firestore
  .document("post-likes/{likeId}")
  .onDelete(async (snap) => {
    try {
      const {postId, userId} = snap.data();

      // Validar que postId y userId existen
      if (!postId || !userId) {
        console.error("Missing postId or userId in unlike data");
        return;
      }

      // Validar que el post existe
      const postExists = await documentExists(`community-posts/${postId}`);
      if (!postExists) {
        console.error(`Post ${postId} does not exist for unlike`);
        return;
      }

      // Decrementar contador de likes de forma ATÓMICA
      await incrementCounter(`community-posts/${postId}`, "likes", -1);

      console.log(`Like removed from post ${postId} by user ${userId}`);
    } catch (error) {
      console.error("Error in onPostLikeDelete:", error);
      throw error;
    }
  });
