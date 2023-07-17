"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "UserId" });
      this.belongsTo(models.Posts, { foreignKey: "PostId" });
    }
  }
  Comments.init(
    {
      content: DataTypes.STRING,
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "UserId",
      },
      PostId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "PostId",
      },
    },
    {
      sequelize,
      modelName: "Comments",
      tableName: "comments",
    }
  );
  return Comments;
};
