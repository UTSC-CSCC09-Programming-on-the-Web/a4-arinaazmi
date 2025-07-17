import express from "express";
import { Image } from "../models/image.js";
import { Comment } from "../models/comment.js";
import { User } from "../models/user.js";
import { authMiddleware } from "../middleware/authenticator.js";

//authMiddleware.authenticate;
export const commentsRouter = express.Router();

// Delete a given comment
commentsRouter.delete(
  "/:commentId",
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      // if user owns the comment
      if (comment.userId === req.user.id) {
        await comment.destroy();
        return res.json({ success: true });
      }
      // or if user owns the gallery (image)
      const img = await Image.findByPk(comment.imageId);
      if (img && img.userId === req.user.id) {
        await comment.destroy();
        return res.json({ success: true });
      }
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    } catch (err) {
      next(err);
    }
  }
);

// get comment by id
commentsRouter.get(
  "/:commentId",
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findByPk(commentId, {
        include: [
          { model: Image, as: "image" },
          { model: User, as: "user" },
        ],
      });
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json(comment);
    } catch (err) {
      next(err);
    }
  }
);
