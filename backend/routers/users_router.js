import { User } from "../models/user.js";
import { Router } from "express";
import bcrypt from "bcrypt";

export const usersRouter = Router();

usersRouter.post("/signup", async (req, res) => {
  const user = User.build({
    username: req.body.username,
  });
  // generate password - salted and hashed
  const password = req.body.password;
  const salt = bcrypt.genSaltSync(10);
  user.password = bcrypt.hashSync(password, salt);
  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(422).json({ error: "User creation failed." });
  }
  //req.session.userId = user.id;
  return res.json({
    username: user.username,
  });
});

usersRouter.post("/signin", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });
  if (user === null) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  // password incorrect
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  if (!user.token) {
    // generate a token for the user
    user.token = bcrypt.hashSync(user.username + Date.now(), 10);
    user.token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // token valid for 24 hours
    await user.save();
  }
  return res.json(user);
});

usersRouter.get("/signout", async function (req, res) {
  const user = await User.findOne({
    where: {
      token: req.headers.authorization,
    },
  });
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  // remove the token from the user
  user.token = null;
  user.token_expiry = null;
  await user.save();

  return res.json({ message: "Signed out." });
});

usersRouter.get("/me", async (req, res) => {
  const user = await User.findOne({
    where: {
      token: req.headers.authorization,
    },
  });
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  return res.json({
    id: user.id,
  });
});
