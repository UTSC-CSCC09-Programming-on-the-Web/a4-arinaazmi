import { User } from "../models/user.js";

export const authMiddleware = {
  authenticate,
};
// --- auth middleware ---
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // assume header is "Bearer <token>" or just "<token>"
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const user = await User.findOne({ where: { token } });
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Check if token is expired
  if (user.token_expiry && new Date(user.token_expiry) < new Date()) {
    user.token = null;
    user.token_expiry = null;
    await user.save();
    return res.status(401).json({ error: "Token expired" });
  }

  req.user = user["dataValues"] || user; // Use dataValues for Sequelize instances
  next();
}
