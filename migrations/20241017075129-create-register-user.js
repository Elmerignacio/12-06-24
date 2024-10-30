'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('register_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      lastName: {
        type: Sequelize.STRING
      },
      firstName: {
        type: Sequelize.STRING
      },
      yearLevel: {
        type: Sequelize.STRING
      },
      block: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING
      },
      userName: {
        type: Sequelize.STRING
      },
      password: {
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
    await queryInterface.dropTable('register_users');
  }
};