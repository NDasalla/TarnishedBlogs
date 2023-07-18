"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "users",
      [
        {
          name: "John Doe",
          username: "test",
          password: await bcrypt.hash("password", 10),
        },
      ],
      {}
    );
    const users = await queryInterface.sequelize.query(`SELECT id FROM users`);
    const userId = users[0][0].id;
    await queryInterface.bulkInsert(
      "posts",
      [
        {
          title: "Post 1",
          content: "Content 1",
          UserId: userId,
        },
        {
          title: "Post 2",
          content: "Content 2",
          UserId: userId,
        },
      ],
      {}
    );
    const posts = await queryInterface.sequelize.query(`SELECT id FROM posts`);
    const postId = posts[0][0].id;
    await queryInterface.bulkInsert("comments", [
      {
        content: "Comment 1",
        UserId: userId,
        PostId: postId,
      },
      {
        content: "Comment 2",
        UserId: userId,
        PostId: postId,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("posts", null, {});
    await queryInterface.bulkDelete("comments", null, {});
  },
};
