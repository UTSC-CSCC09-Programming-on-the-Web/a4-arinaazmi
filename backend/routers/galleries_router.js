import express from "express";
import { sequelize } from "../datasource.js";
import { Op } from "sequelize";
import { Image } from "../models/image.js";
import { Comment } from "../models/comment.js";
import { User } from "../models/user.js";

export const galleriesRouter = express.Router();

// display all galleries (users with images)
galleriesRouter.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 1;
    let cursor = req.query.cursor;
    let where = {};
    // If we have a cursor, only grab images with id < cursor (older)
    if (cursor && !isNaN(cursor) && parseInt(cursor, 10) > 0) {
      where.id = { [Op.lte]: cursor };
    }
    const users = await User.findAll({
      where,
      order: [["id", "DESC"]],
      limit: 1,
      include: [
        { model: Image, as: "images", attributes: ["id", "title", "filePath"] },
        {
          model: Comment,
          as: "comments",
          attributes: ["id", "content", "date"],
        },
      ],
      // Exclude password and other sensitive fields
      attributes: {
        exclude: ["password", "token", "token_expiry"],
      },
    });
    if (!cursor) {
      cursor = users.length > 0 ? users[0].id : null;
      where.id = { [Op.lt]: cursor }; // if no cursor, get the latest users
    }

    console.log("users", users);

    // nextCursor: last image's id, or null if at end
    let nextCursor = null;
    if (users.length === limit) {
      // Is there another image older than the last image in this batch?
      const more = await User.findOne({
        where: { id: { [Op.lt]: cursor } },
        order: [["id", "DESC"]],
        limit: 1,
        // exclude password and other sensitive fields
        attributes: {
          exclude: ["password", "token", "token_expiry"],
        },
      });
      if (more) nextCursor = more.id;
    }

    console.log("nextCursor", nextCursor);

    // prevCursor: id > current cursor (newer than this page)
    let prevCursor = null;
    if (cursor) {
      const prev = await User.findOne({
        where: { id: { [Op.gt]: cursor } },
        order: [["id", "ASC"]],
        limit: 1,
        // exclude password and other sensitive fields
        attributes: {
          exclude: ["password", "token", "token_expiry"],
        },
      });
      prevCursor = prev ? prev.id : null;
    }

    res.json({ users, prevCursor, nextCursor });
  } catch (err) {
    next(err);
  }
});

// Count the number of galleries (users with images)
galleriesRouter.get("/count", async (req, res, next) => {
  try {
    const count = await User.count();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// galleriesRouter.get("/", async (req, res, next) => {
//     try {
//         const galleries = await Image.findAll({
//             include: [
//                 { model: User, as: "user", attributes: ["id", "username"] },
//                 { model: Comment, as: "comments", attributes: ["id", "content", "date"] },
//             ],
//             order: [["id", "DESC"]],
//         });
//         res.json(galleries);
//     } catch (err) {
//         next(err);
//     }
// });

// Read: get all images in a gallery (user)
galleriesRouter.get("/:id/images", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 1;
    let cursor = req.query.cursor;
    let where = {};
    // If we have a cursor, only grab images with id < cursor (older)
    if (cursor && !isNaN(cursor) && parseInt(cursor, 10) > 0) {
      where.id = { [Op.lte]: cursor };
    }

    const images = await Image.findAll({
      where: { userId: req.params.id, ...where },
      order: [["id", "DESC"]],
      limit: 1,
    });
    if (!cursor) {
      cursor = images.length > 0 ? images[0].id : null;
      where.userId = req.params.id; // if no cursor, get the latest images for this user
      where.id = { [Op.lt]: cursor }; // if no cursor, get the latest images
    }

    // nextCursor: last image's id, or null if at end
    let nextCursor = null;
    if (images.length === limit) {
      // Is there another image older than the last image in this batch?
      const more = await Image.findOne({
        where: { userId: req.params.id, id: { [Op.lt]: cursor } },
        order: [["id", "DESC"]],
        limit: 1,
      });
      if (more) nextCursor = more.id;
    }
    // prevCursor: id > current cursor (newer than this page)
    let prevCursor = null;
    if (cursor) {
      const prev = await Image.findOne({
        where: { userId: req.params.id, id: { [Op.gt]: cursor } },
        order: [["id", "ASC"]],
        limit: 1,
      });
      prevCursor = prev ? prev.id : null;
    }

    res.json({ images, prevCursor, nextCursor });
  } catch (err) {
    next(err);
  }
});

// // Create: upload a new image
// galleriesRouter.post(
//   "/:id/images",
//   authMiddleware.authenticate,
//   upload.single("imageFile"),
//   async (req, res, next) => {
//     try {
//       if (!validateInput(req, res, imageSchema)) return;
//       const { title } = req.body;
//       if (!req.file || !title || req.user.id === null) {
//         return res.status(400).json({ error: "Missing file or title or user ID" });
//       }
//       // owner is req.user
//       const img = await Image.create({
//         title,
//         userId: req.user.id,
//         filePath: req.file.filename,
//       });
//       res.status(201).json(img);
//     } catch (err) {
//       next(err);
//     }
//   }
// );

galleriesRouter.get("/:id/images/count", async (req, res, next) => {
  try {
    // Validate the ID is a number!!
    const galleryId = parseInt(req.params.id, 10);
    if (isNaN(galleryId)) {
      return res.status(400).json({ error: "Invalid gallery ID" });
    }
    // Count images for the specified gallery (user)
    const images = await Image.findAll({
      where: { userId: galleryId },
      attributes: [[sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    });
    if (images.length === 0) {
      return res
        .status(404)
        .json({ error: "No images found for this gallery" });
    }
    // return the count
    const count = images[0].get("count");
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// // Read: get image metadata
// galleriesRouter.get("/:id/images/:imageId", async (req, res, next) => {
//   try {
//     // Validate the ID is a number!!
//     const galleryId = parseInt(req.params.id, 10);
//     if (isNaN(galleryId)) {
//         return res.status(400).json({ error: "Invalid gallery ID" });
//     }
//     const img = await Image.findByPk(req.params.imageId);
//     if (!img) return res.status(404).json({ error: "Image not found" });
//     res.json(img);
//   } catch (err) {
//     next(err);
//   }
// });

// galleriesRouter.get("/:id/image/:imageId/file", async (req, res, next) => {
//   try {
//     // Validate the ID is a number!!
//     const galleryId = parseInt(req.params.id, 10);
//     if (isNaN(galleryId)) {
//         return res.status(400).json({ error: "Invalid gallery ID" });
//     }

//     const img = await Image.findByPk(req.params.imageId);
//     if (!img) {
//       return res
//         .status(404)
//         .json({ error: `Image(id=${req.params.imageId}) not found.` });
//     }
//     if (!img.filePath) {
//       return res
//         .status(404)
//         .json({ error: `Image(id=${req.params.imageId}) has no file to serve.` });
//     }
//     res.sendFile(img.filePath, { root: uploadDir });
//   } catch (err) {
//     next(err);
//   }
// });

// // Delete: remove image and file
// galleriesRouter.delete("/:id/images/:imageId", authMiddleware.authenticate, async (req, res, next) => {
//   try {
//     // Validate the ID is a number!!
//     const galleryId = parseInt(req.params.id, 10);
//     if (isNaN(galleryId)) {
//         return res.status(400).json({ error: "Invalid gallery ID" });
//     }

//     const img = await Image.findByPk(req.params.imageId);
//     if (!img) return res.status(404).json({ error: "Image not found" });
//     if (img.userId !== req.user.id) {
//       return res.status(403).json({ error: "Not authorized to delete this image" });
//     }
//     await img.destroy();
//     res.json({ success: true });
//   } catch (err) {
//     next(err);
//   }
// });
