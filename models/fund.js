'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class fund extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  fund.init({
    date: DataTypes.DATEONLY,
    yearLevel: DataTypes.INTEGER,
    block: DataTypes.STRING,
    payable: DataTypes.STRING,
    amountReceive: DataTypes.INTEGER,
    COH: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'fund',
  });
  return fund;
};