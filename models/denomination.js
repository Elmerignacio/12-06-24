'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class denomination extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  denomination.init({
    date: DataTypes.DATEONLY,
    yearLevel: DataTypes.INTEGER,
    block: DataTypes.STRING,
    Amount1000: DataTypes.INTEGER,
    Amount500: DataTypes.INTEGER,
    Amount200: DataTypes.INTEGER,
    Amount100: DataTypes.INTEGER,
    Amount50: DataTypes.INTEGER,
    Amount20: DataTypes.INTEGER,
    coin: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'denomination',
  });
  return denomination;
};