'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('remittances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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
      date: {
        type: Sequelize.DATEONLY
      },
      payable: {
        type: Sequelize.STRING
      },
      paid: {
        type: Sequelize.INTEGER
      },
      balance: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('remittances');
  }
};