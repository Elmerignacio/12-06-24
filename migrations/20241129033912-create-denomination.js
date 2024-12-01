'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('denominations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      Amount1000: {
        type: Sequelize.INTEGER
      },
      Amount500: {
        type: Sequelize.INTEGER
      },
      Amount200: {
        type: Sequelize.INTEGER
      },
      Amount100: {
        type: Sequelize.INTEGER
      },
      Amount50: {
        type: Sequelize.INTEGER
      },
      Amount20: {
        type: Sequelize.INTEGER
      },
      coin: {
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
    await queryInterface.dropTable('denominations');
  }
};