const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');
const { sendSuccess, buildPagination } = require('../utils/apiResponse');

// @desc    Get feed posts (paginated, filterable, searchable)
// @route   GET /api/posts?category=&search=&page=&limit=&sort=trending|recent
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 10, sort = 'recent' } = req.query;
  const query = { isRemoved: false };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const sortStage =
    sort === 'trending' ? { $expr: undefined } : null; // placeholder, real trending uses aggregation below

  let posts;
  let total;

  if (sort === 'trending') {
    // Trending = recent + high engagement (likes + comments), last 7 days weighted higher.
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          engagementScore: {
            $add: [{ $size: '$likes' }, { $multiply: ['$commentCount', 1.5] }, { $multiply: ['$shareCount', 2] }],
          },
        },
      },
      { $sort: { engagementScore: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];
    posts = await Post.aggregate(pipeline);
    await Post.populate(posts, { path: 'author', select: 'name avatar role department' });
    total = await Post.countDocuments(query);
  } else {
    [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name avatar role department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments(query),
    ]);
  }

  sendSuccess(res, 200, 'Posts fetched', posts, buildPagination(Number(page), Number(limit), total));
});

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { content, category } = req.body;
  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

  const post = await Post.create({ author: req.user._id, content, category, images });
  await post.populate('author', 'name avatar role department');

  await logActivity(req.user._id, 'post_created', `${req.user.name} created a post`);
  sendSuccess(res, 201, 'Post created', post);
});

// @desc    Update own post
// @route   PUT /api/posts/:id
// @access  Private (owner)
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isRemoved) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (post.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to edit this post');
  }
  if (req.body.content !== undefined) post.content = req.body.content;
  if (req.body.category !== undefined) post.category = req.body.category;
  post.isEdited = true;
  await post.save();
  sendSuccess(res, 200, 'Post updated', post);
});

// @desc    Delete own post (or admin)
// @route   DELETE /api/posts/:id
// @access  Private (owner or superadmin)
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const isOwner = post.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to delete this post');
  }
  await post.deleteOne();
  await Comment.deleteMany({ post: post._id });
  sendSuccess(res, 200, 'Post deleted');
});

// @desc    Like / unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(req.user._id);
    await notify({
      recipient: post.author,
      sender: req.user._id,
      type: 'post_like',
      message: `${req.user.name} liked your post`,
      link: `/posts/${post._id}`,
    });
  }
  await post.save();
  sendSuccess(res, 200, alreadyLiked ? 'Post unliked' : 'Post liked', { likesCount: post.likes.length });
});

// @desc    Add a comment
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const comment = await Comment.create({ post: post._id, author: req.user._id, text: req.body.text });
  post.commentCount += 1;
  await post.save();
  await comment.populate('author', 'name avatar');

  await notify({
    recipient: post.author,
    sender: req.user._id,
    type: 'post_comment',
    message: `${req.user.name} commented on your post`,
    link: `/posts/${post._id}`,
  });

  sendSuccess(res, 201, 'Comment added', comment);
});

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.id })
    .populate('author', 'name avatar')
    .sort({ createdAt: 1 });
  sendSuccess(res, 200, 'Comments fetched', comments);
});

// @desc    Share a post (increments share count)
// @route   POST /api/posts/:id/share
// @access  Private
const sharePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { shareCount: 1 } }, { new: true });
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  sendSuccess(res, 200, 'Post shared', { shareCount: post.shareCount });
});

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
const reportPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  await Report.create({
    reportedBy: req.user._id,
    targetType: 'Post',
    targetId: post._id,
    reason: req.body.reason || 'Inappropriate content',
  });
  post.isReported = true;
  post.reportCount += 1;
  await post.save();
  sendSuccess(res, 201, 'Post reported to moderators');
});

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  sharePost,
  reportPost,
};
