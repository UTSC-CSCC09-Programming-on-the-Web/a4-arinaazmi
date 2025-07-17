import express from "express";
import multer from "multer";
import path from "path";
import { Image } from "../models/image.js";
import { Comment } from "../models/comment.js";
import { User } from "../models/user.js";
import { authMiddleware } from "../middleware/authenticator.js";
import { validateInput } from "../utils/validate-input.js";

const uploadDir = path.resolve("uploads");

const upload = multer({ dest: "uploads/" });
export const imagesRouter = express.Router();

const imageSchema = [
  { name: "title", required: true, type: "string", location: "body" },
  { name: "imageFile", required: true, type: "file", location: "file" },
];

// Create: upload a new image
imagesRouter.post(
  "/",
  authMiddleware.authenticate,
  upload.single("imageFile"),
  async (req, res, next) => {
    try {
      if (!validateInput(req, res, imageSchema)) return;
      const { title } = req.body;
      if (!req.file || !title || req.user.id === null) {
        return res
          .status(400)
          .json({ error: "Missing file or title or user ID" });
      }
      // owner is req.user
      const img = await Image.create({
        title,
        userId: req.user.id,
        filePath: req.file.filename,
      });
      res.status(201).json(img);
    } catch (err) {
      next(err);
    }
  }
);

// Read: get image metadata
imagesRouter.get("/:id", async (req, res, next) => {
  try {
    // Validate the ID is a number!!
    const img = await Image.findByPk(req.params.id);
    const user = await User.findByPk(img.userId, {
      attributes: ["id", "username"],
    });
    if (!img) return res.status(404).json({ error: "Image not found" });
    // Add user info to the image object
    img.dataValues.user = user;
    res.json(img);
  } catch (err) {
    next(err);
  }
});

imagesRouter.get("/:id/file", async (req, res, next) => {
  try {
    // Validate the ID is a number!!
    const img = await Image.findByPk(req.params.id);
    if (!img) {
      return res
        .status(404)
        .json({ error: `Image(id=${req.params.id}) not found.` });
    }
    if (!img.filePath) {
      return res
        .status(404)
        .json({ error: `Image(id=${req.params.id}) has no file to serve.` });
    }
    res.sendFile(img.filePath, { root: uploadDir });
  } catch (err) {
    next(err);
  }
});

// Delete: remove image and file
imagesRouter.delete(
  "/:id",
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const img = await Image.findByPk(req.params.id);
      if (!img) return res.status(404).json({ error: "Image not found" });
      if (img.userId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this image" });
      }
      await img.destroy();
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

////////////// COMMENTS ROUTES //////////////

const commentSchema = [
  { name: "content", required: true, type: "string", location: "body" },
];

// Add a comment to a given image
imagesRouter.post(
  "/:id/comments",
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      if (!validateInput(req, res, commentSchema)) return;
      const imageId = req.params.id;
      if (isNaN(imageId)) {
        return res.status(422).json({ error: "Invalid image id" });
      }
      const img = await Image.findByPk(imageId);
      console.log("Image found:", img);
      console.log("User ID:", req.user.id);
      console.log("Request body:", req.body);
      if (!img) return res.status(404).json({ error: "Image not found" });
      const { content } = req.body;
      const comment = await Comment.create({
        imageId,
        userId: req.user.id,
        content,
      });
      console.log("Comment created:", comment);
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }
);

// Retrieve comments for a given image (paginated)
imagesRouter.get(
  "/:id/comments",
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const imageId = req.params.id;
      const limit = parseInt(req.query.limit, 10) || 10;
      const page = parseInt(req.query.page, 10) || 1;
      const offset = (page - 1) * limit;
      const comments = await Comment.findAll({
        where: { imageId },
        include: [{ model: User, as: "user", attributes: ["username"] }],
        order: [["createdAt", "DESC"]],
        limit: limit + 1,
        offset,
      });
      res.json({ page, limit, comments });
    } catch (err) {
      next(err);
    }
  }
);

// Delete a given comment
imagesRouter.delete(
  "/comments/:commentId",
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

imagesRouter.get(
  "/:id/comments/count",
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const imageId = req.params.id;
      const count = await Comment.count({ where: { imageId } });
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
);
