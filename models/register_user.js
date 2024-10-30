'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class register_user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  register_user.init({
    userId: DataTypes.INTEGER,
    lastName: DataTypes.STRING,
    firstName: DataTypes.STRING,
    yearLevel: DataTypes.STRING,
    block: DataTypes.STRING,
    gender: DataTypes.STRING,
    role: DataTypes.STRING,
    userName: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'register_user',
  });
  return register_user;
};