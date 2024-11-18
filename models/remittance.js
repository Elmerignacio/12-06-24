'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class remittance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  remittance.init({
    student: DataTypes.STRING,
    yearLevel: DataTypes.INTEGER,
    block: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    payable: DataTypes.STRING,
    paid: DataTypes.INTEGER,
    balance: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'remittance',
  });
  return remittance;
};