const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { makeUploader } = require('../middleware/uploadMiddleware');
const {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  sharePost,
  reportPost,
} = require('../controllers/postController');

const router = express.Router();
const uploadPostImages = makeUploader('posts', 'image', 4);

router.use(protect);

router.get('/', getPosts);
router.post('/', uploadPostImages.array('images', 4), createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

router.post('/:id/like', toggleLike);
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);
router.post('/:id/share', sharePost);
router.post('/:id/report', reportPost);

module.exports = router;
