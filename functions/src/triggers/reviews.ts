import * as functions from "firebase-functions";
import {db} from "../config.js";
import {FieldValue} from "firebase-admin/firestore";

/**
 * Recalcular y actualizar el promedio de rating de un usuario
 * @param {string} reviewedUserId - ID del usuario que recibió la review
 */
async function updateUserRating(reviewedUserId: string): Promise<void> {
  try {
    const reviewsSnapshot = await db
      .collection("reviews")
      .where("reviewedUserId", "==", reviewedUserId)
      .get();

    if (reviewsSnapshot.empty) {
      await db.collection("user-ratings").doc(reviewedUserId).set(
        {
          averageRating: 0,
          totalReviews: 0,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true}
      );
      console.log(
        `No reviews found for user ${reviewedUserId}, reset rating to 0`
      );
      return;
    }

    let totalRating = 0;
    let count = 0;

    reviewsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating && typeof data.rating === "number") {
        totalRating += data.rating;
        count++;
      }
    });

    if (count === 0) {
      await db.collection("user-ratings").doc(reviewedUserId).set(
        {
          averageRating: 0,
          totalReviews: 0,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true}
      );
      return;
    }

    const averageRating = totalRating / count;
    const roundedRating = Math.round(averageRating * 10) / 10; // 1 decimal

    await db.collection("user-ratings").doc(reviewedUserId).set(
      {
        averageRating: roundedRating,
        totalReviews: count,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    console.log(
      `Updated rating for user ${reviewedUserId}: ` +
        `${roundedRating} (${count} reviews)`
    );
  } catch (error) {
    console.error("Error updating user rating:", error);
    throw error;
  }
}

/**
 * Cloud Function: Recalcular rating cuando se crea una review
 * Trigger: onCreate en collection reviews
 * Acción: Recalcula user-ratings/{reviewedUserId}.averageRating
 */
export const onReviewCreate = functions.firestore
  .document("reviews/{reviewId}")
  .onCreate(async (snap) => {
    try {
      const {reviewedUserId} = snap.data();

      if (!reviewedUserId) {
        console.error("Missing reviewedUserId in review data");
        return;
      }

      await updateUserRating(reviewedUserId);
      console.log(`Review created, updated rating for user ${reviewedUserId}`);
    } catch (error) {
      console.error("Error in onReviewCreate:", error);
      throw error;
    }
  });

/**
 * Cloud Function: Recalcular rating cuando se actualiza una review
 * Trigger: onUpdate en collection reviews
 * Acción: Recalcula user-ratings/{reviewedUserId}.averageRating
 */
export const onReviewUpdate = functions.firestore
  .document("reviews/{reviewId}")
  .onUpdate(async (change) => {
    try {
      const {reviewedUserId} = change.after.data();

      if (!reviewedUserId) {
        console.error("Missing reviewedUserId in review data");
        return;
      }

      await updateUserRating(reviewedUserId);
      console.log(
        `Review updated, recalculated rating for user ${reviewedUserId}`
      );
    } catch (error) {
      console.error("Error in onReviewUpdate:", error);
      throw error;
    }
  });

/**
 * Cloud Function: Recalcular rating cuando se elimina una review
 * Trigger: onDelete en collection reviews
 * Acción: Recalcula user-ratings/{reviewedUserId}.averageRating
 */
export const onReviewDelete = functions.firestore
  .document("reviews/{reviewId}")
  .onDelete(async (snap) => {
    try {
      const {reviewedUserId} = snap.data();

      if (!reviewedUserId) {
        console.error("Missing reviewedUserId in review data");
        return;
      }

      await updateUserRating(reviewedUserId);
      console.log(
        `Review deleted, recalculated rating for user ${reviewedUserId}`
      );
    } catch (error) {
      console.error("Error in onReviewDelete:", error);
      throw error;
    }
  });
