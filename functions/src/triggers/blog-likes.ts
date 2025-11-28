import * as functions from "firebase-functions";
import {incrementCounter, documentExists} from "../utils/firestore-helpers.js";

/**
 * Cloud Function: Incrementar contador de likes cuando se crea documento
 * Trigger: onCreate en collection blog-likes
 * Acción: Incrementa blog-posts/{postId}.likesCount
 */
export const onBlogLikeCreate = functions.firestore
  .document("blog-likes/{likeId}")
  .onCreate(async (snap) => {
    try {
      const {postId, userId} = snap.data();

      // Validar que postId y userId existen
      if (!postId || !userId) {
        console.error("Missing postId or userId in blog like data");
        return;
      }

      // Validar que el blog post existe
      const postExists = await documentExists(`blog-posts/${postId}`);
      if (!postExists) {
        console.error(`Blog post ${postId} does not exist`);
        return;
      }

      // Incrementar contador de likes de forma ATÓMICA
      await incrementCounter(`blog-posts/${postId}`, "likesCount", 1);

      console.log(`Like added to blog post ${postId} by user ${userId}`);
    } catch (error) {
      console.error("Error in onBlogLikeCreate:", error);
      throw error;
    }
  });

/**
 * Cloud Function: Decrementar contador de likes cuando se elimina documento
 * Trigger: onDelete en collection blog-likes
 * Acción: Decrementa blog-posts/{postId}.likesCount
 */
export const onBlogLikeDelete = functions.firestore
  .document("blog-likes/{likeId}")
  .onDelete(async (snap) => {
    try {
      const {postId, userId} = snap.data();

      // Validar que postId y userId existen
      if (!postId || !userId) {
        console.error("Missing postId or userId in blog like data");
        return;
      }

      // Validar que el blog post existe
      const postExists = await documentExists(`blog-posts/${postId}`);
      if (!postExists) {
        console.error(`Blog post ${postId} does not exist for unlike`);
        return;
      }

      // Decrementar contador de likes de forma ATÓMICA
      await incrementCounter(`blog-posts/${postId}`, "likesCount", -1);

      console.log(`Like removed from blog post ${postId} by user ${userId}`);
    } catch (error) {
      console.error("Error in onBlogLikeDelete:", error);
      throw error;
    }
  });
