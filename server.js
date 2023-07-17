const express = require("express");
const app = express();
const port = 4000;
const bcrypt = require("bcryptjs");
const session = require("express-session");
require("dotenv").config();

const { Posts, User, Comments } = require("./models");

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${req.statusCode}`);
  });
  next();
});

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000,
    },
  })
);

// Check if user is signed in
const autheticateUser = (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "You must be logged in to view this page" });
  }
  next();
};

app.get("/", (req, res) => {
  res.send("Welcome, Tarnished.");
});

// New user signup
app.post("/signup", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  try {
    const user = await User.create({
      name: req.body.name,
      username: req.body.username,
      password: hashedPassword,
    });
    req.session.userId = user.id;

    return res.status(201).json({
      message: "User Created!",
      user: {
        name: user.name,
        username: user.username,
      },
    });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(422).json({ errors: err.errors.map((e) => e.message) });
    } else if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(422)
        .json({ errors: error.errors.map((e) => e.message) });
    }
    console.error(err);
    res.status(500).json({
      message: "Error occured while creating a new user account",
    });
  }
});

// User login
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.body.username } });

    if (user === null) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    bcrypt.compare(req.body.password, user.password, (error, result) => {
      if (result) {
        req.session.userId = user.id;
        return res.status(200).json({
          message: "Login successful",
          user: {
            name: user.name,
            username: user.username,
          },
        });
      } else {
        res.status(401).json({ message: "Incorrect credentials" });
      }
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "An error occured during the login process" });
  }
});

// User logout
app.delete("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.sendStatus(500);
    }

    res.clearCookie("connect.sid");
    return res.sendStatus(200);
  });
});

// Get all posts
app.get("/posts", autheticateUser, async (req, res) => {
  try {
    const allPosts = await Posts.findAll();
    res.status(200).json(allPosts);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Get post by ID
app.get("/posts/:postId", autheticateUser, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  try {
    const post = await Posts.findOne({ where: { id: postId } });

    if (post) {
      res.status(200).json(post);
    } else {
      res.status(404).send({ message: "post not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Create a new post
app.post("/posts", autheticateUser, async (req, res) => {
  try {
    const newPost = await Posts.create(req.body);
    res.status(200).json(newPost);
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(422).json({ errors: err.errors.map((e) => e.message) });
    }
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Update post by ID
app.patch("/posts/:postId", autheticateUser, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  try {
    const record = await Posts.findOne({ where: { id: postId } });

    if (record && record.UserId !== parseInt(req.session.userId, 10)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to perform that action" });
    }

    const [numberOfAffectedRows, affectedRows] = await Posts.update(req.body, {
      where: { id: postId },
      returning: true,
    });

    if (numberOfAffectedRows > 0) {
      res.status(200).json(affectedRows[0]);
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(422).json({ errors: err.errors.map((e) => e.message) });
    }
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Delete a specific job
app.delete("/posts/:postId", autheticateUser, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  try {
    const record = await Posts.findOne({ where: { id: postId } });
    if (record && record.UserId !== parseInt(req.session.userId, 10)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }

    const deletedPost = await Posts.destroy({ where: { id: postId } });
    if (deletedPost > 0) {
      res.status(200).send({ message: "Post deleted successfully" });
    } else {
      res.status(404).send({ message: "Post not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

//Get comments from a specific post
app.get("/posts/:postId/comments", autheticateUser, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);

  try {
    // Check if post exists
    const post = await Posts.findOne({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const allComments = await Comments.findAll({ where: { PostId: postId } });
    if (allComments.length > 0) {
      return res.status(201).json(allComments);
    } else {
      return res.status(404).json({
        message: "No comments found",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error has occurred while creating comment",
    });
  }
});

// Get a specific comment
app.get("/comments/:commentId", autheticateUser, async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);

  try {
    // Check if post exists
    const comment = await Comments.findOne({ where: { id: commentId } });

    if (comment) {
      return res.status(201).json(comment);
    } else {
      return res.status(404).json({
        message: "No comments found",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error has occurred while fetching for comment",
    });
  }
});

// Get all comments from a specific post
app.post("/posts/:postId/comments", autheticateUser, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);

  try {
    // Check if the post exists
    const post = await Posts.findOne({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ message: "The post doesn't exist" });
    }
    const newComment = await Comments.create({
      content: req.body.content,
      UserId: req.session.userId,
      PostId: postId,
    });
    res.status(201).json({
      message: "Comment created successfully",
      comment: newComment.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error has occurred while creating comment",
    });
  }
});

// Update comment by ID
app.patch("/comments/:commentId", autheticateUser, async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  try {
    const record = await Comments.findOne({ where: { id: commentId } });

    if (record && record.UserId !== parseInt(req.session.userId, 10)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    const [numberOfAffectedRows, affectedRows] = await Comments.update(
      req.body,
      {
        where: { id: commentId },
        returning: true,
      }
    );

    if (numberOfAffectedRows > 0) {
      res.status(200).json(affectedRows[0]);
    } else {
      res.status(404).json({ message: "Comment not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Delete comment by ID
app.delete("/comments/:commentId", autheticateUser, async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  try {
    const record = await Comments.findOne({ where: { id: commentId } });

    if (record && record.UserId !== parseInt(req.session.userId, 10)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this comments" });
    }

    const deletedComment = await Comments.destroy({ where: { id: commentId } });
    if (deletedComment > 0) {
      res.status(200).send({ message: "Comment deleted successfully" });
    } else {
      res.status(404).send({ message: "Comment not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Get all comments from current user
app.get("/user/comments", autheticateUser, async (req, res) => {
  try {
    // check if the post exist
    const allComments = await Comments.findAll({
      where: { UserId: parseInt(req.session.userId, 10) },
    });

    if (allComments.length > 0) {
      return res.status(201).json(allComments);
    } else {
      return res.status(404).json({
        message: "No comments found",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error has occurred while fetching for comment",
    });
  }
});

app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});
