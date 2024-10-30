'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class payable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  payable.init({
    yearLevel: DataTypes.STRING,
    block: DataTypes.STRING,
    student: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'payable',
  });
  return payable;
};