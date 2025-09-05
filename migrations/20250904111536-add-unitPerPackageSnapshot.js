'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('order_items', 'unitPerPackageSnapshot', {
      type: Sequelize.INTEGER,
      allowNull: true,      // allow null for legacy rows
      defaultValue: null,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('order_items', 'unitPerPackageSnapshot');
  },
};
