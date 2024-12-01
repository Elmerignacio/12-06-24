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
    userId: DataTypes.INTEGER,
    student: DataTypes.STRING,
    yearLevel: DataTypes.INTEGER,
    block: DataTypes.STRING,
    gender: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    payables: DataTypes.STRING,
    paid: DataTypes.INTEGER,
    balances: DataTypes.INTEGER,
    status: DataTypes.STRING,
    remittedBy: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'remittance',
  });
  return remittance;
};