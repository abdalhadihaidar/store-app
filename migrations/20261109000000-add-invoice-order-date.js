'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('invoices');
    if (columns.orderDate) return;
    await queryInterface.addColumn('invoices', 'orderDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('invoices', 'orderDate');
  },
};
