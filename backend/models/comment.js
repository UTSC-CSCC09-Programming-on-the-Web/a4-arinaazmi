import { DataTypes } from "sequelize";
import { sequelize } from "../datasource.js";
import { Image } from "./image.js";
import { User } from "./user.js";

export const Comment = sequelize.define("Comment", {
  imageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Image, key: "id" },
    onDelete: "CASCADE",
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "text",
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Automatically set to current date/time
  },
});

Image.hasMany(Comment, { foreignKey: "imageId", as: "comments" });
Comment.belongsTo(Image, { foreignKey: "imageId", as: "image" });

Comment.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
