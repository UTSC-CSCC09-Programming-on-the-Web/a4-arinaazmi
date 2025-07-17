import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    required: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    required: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});
