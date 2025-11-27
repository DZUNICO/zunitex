// Admin SDK se inicializa en config.ts
// Importar config para asegurar inicialización
import "./config.js";

// ===== IMPORTAR TRIGGERS =====
// Post Likes
export {onPostLike, onPostUnlike} from "./triggers/post-likes.js";

// Blog Likes (cuando exista)
// export { onBlogLike, onBlogUnlike } from './triggers/blog-likes';

// Followers (cuando exista)
// export { onFollowCreate, onFollowDelete } from './triggers/followers';

// Resource Likes (cuando exista)
// export { onResourceLike, onResourceUnlike } from './triggers/resource-likes';

// Reviews (cuando exista)
// export {
//   onReviewCreate,
//   onReviewUpdate,
//   onReviewDelete
// } from './triggers/reviews';

console.log("🚀 Cloud Functions STARLOGIC iniciadas");


