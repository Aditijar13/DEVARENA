const { Comment } = require('../models/Supplementary');

const getComments = async (req, res) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const { type, page = 1, limit = 20 } = req.query;
    const query = { event: eventId, parentComment: null, isDeleted: false };
    if (type) query.type = type;

    const total = await Comment.countDocuments(query);
    const comments = await Comment.find(query)
      .populate('author', 'name avatar headline role')
      .populate({
        path: 'replies',
        match: { isDeleted: false },
        populate: { path: 'author', select: 'name avatar headline role' },
        options: { sort: { createdAt: 1 } },
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, comments, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const { content, type = 'comment', parentCommentId } = req.body;

    const comment = await Comment.create({
      event: eventId,
      author: req.user.id,
      content,
      type,
      parentComment: parentCommentId || null,
    });

    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $push: { replies: comment._id } });
    }

    const populated = await Comment.findById(comment._id).populate('author', 'name avatar headline role');

    if (req.io) {
      req.io.to(`event:${eventId}`).emit('new_comment', populated);
    }

    return res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (comment.author.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    return res.status(200).json({ success: true, comment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    comment.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();

    return res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const liked = comment.likes.includes(req.user.id);
    if (liked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }
    await comment.save();

    return res.status(200).json({ success: true, liked: !liked, likes: comment.likes.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment, toggleLike };
