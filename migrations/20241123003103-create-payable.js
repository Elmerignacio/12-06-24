'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      student: {
        type: Sequelize.STRING
      },
      yearLevel: {
        type: Sequelize.INTEGER
      },
      block: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      payables: {
        type: Sequelize.STRING
      },
      balances: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payables');
  }
};