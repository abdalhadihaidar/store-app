'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add pdfPath column to angebots table
    await queryInterface.addColumn('angebots', 'pdfPath', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to generated PDF file'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove pdfPath column from angebots table
    await queryInterface.removeColumn('angebots', 'pdfPath');
  }
};
