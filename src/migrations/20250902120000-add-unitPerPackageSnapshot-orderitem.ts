import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('order_items', 'unitPerPackageSnapshot', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('order_items', 'unitPerPackageSnapshot');
  },
};
