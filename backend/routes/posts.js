const { User, Posts, Comments } = require("../models");
const { ForbiddenError, NotFoundError } = require("../errors");
const express = require("express");
const router = express.Router();

const getBlog = async (id) => {
  const post = await Posts.findByPk(parseInt(id, 10));
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  return post;
};

const authorizeEdit = (session, post) => {
  if (parseInt(session.userId, 10) !== post.UserId) {
    throw new ForbiddenError("You are not authorized to edit this post");
  }
};

const authorizeDelete = (session, post) => {
  if (parseInt(session.userId, 10) !== post.UserId) {
    throw new ForbiddenError("You are not authorized to delete this post");
  }
};

const handleErrors = (err, res) => {
  console.error(err);
  if (err.name === "SequelizeValidationError") {
    return res.status(422).json({ errors: err.errors.map((e) => e.message) });
  }
  res.status(500).send({ message: err.message });
};

router.get("/", (req, res) => {
  res.send("Welcome, Tarnished.");
});

// New user signup
router.post("/signup", async (req, res) => {
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
router.post("/login", async (req, res) => {
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
router.delete("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.sendStatus(500);
    }

    res.clearCookie("connect.sid");
    return res.sendStatus(200);
  });
});

// Get all posts
router.get("/posts", autheticateUser, async (req, res) => {
  try {
    const allPosts = await Posts.findAll();
    res.status(200).json(allPosts);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// Get post by ID
router.get("/posts/:postId", autheticateUser, async (req, res) => {
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
router.post("/posts", autheticateUser, async (req, res) => {
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
router.patch("/posts/:postId", autheticateUser, async (req, res) => {
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
router.delete("/posts/:postId", autheticateUser, async (req, res) => {
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
router.get("/posts/:postId/comments", autheticateUser, async (req, res) => {
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
router.get("/comments/:commentId", autheticateUser, async (req, res) => {
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
router.post("/posts/:postId/comments", autheticateUser, async (req, res) => {
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
router.patch("/comments/:commentId", autheticateUser, async (req, res) => {
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
router.delete("/comments/:commentId", autheticateUser, async (req, res) => {
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
router.get("/user/comments", autheticateUser, async (req, res) => {
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
