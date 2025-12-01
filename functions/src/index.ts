// Admin SDK se inicializa en config.ts
// Importar config para asegurar inicialización
import "./config.js";

// ===== IMPORTAR TRIGGERS =====
// Post Likes
export {onPostLikeCreate, onPostLikeDelete} from "./triggers/post-likes.js";

// Blog Likes
export {onBlogLikeCreate, onBlogLikeDelete} from "./triggers/blog-likes.js";

// Resource Likes
export {
  onResourceLikeCreate,
  onResourceLikeDelete,
} from "./triggers/resource-likes.js";

// Followers
export {onFollowerCreate, onFollowerDelete} from "./triggers/followers.js";

// Reviews
export {
  onReviewCreate,
  onReviewUpdate,
  onReviewDelete,
} from "./triggers/reviews.js";

// Scheduled Backups
// TEMPORALMENTE COMENTADO - Descomentar cuando se configure bucket
// export {scheduledFirestoreBackup} from "./scheduled/backup.js";

// NUEVAS EXPORTACIONES - Custom Claims
export {onUserCreate, onUserDocumentUpdate} from "./triggers/user-claims.js";
export {refreshUserToken} from "./callable/refresh-token.js";

console.log("🚀 Cloud Functions STARLOGIC iniciadas");


