import { DataTypes } from "sequelize";
import { sequelize } from "../datasource.js";
import { User } from "./user.js";

export const Image = sequelize.define("Image", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Image.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Image, { foreignKey: "userId", as: "images" });
