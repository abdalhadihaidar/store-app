/**
 * Migration: Update to Packet-Based System
 * 
 * This migration updates the database schema to support packet-based calculations
 * with fractional packages (0.5, 0.25, etc.)
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration to packet-based system...');
    
    try {
      // Update products table to support fractional packages
      await queryInterface.changeColumn('products', 'package', {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of packages (can be fractional)'
      });
      
      await queryInterface.changeColumn('products', 'quantity', {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total pieces (calculated from package × numberperpackage)'
      });
      
      // Update order_items table to support fractional packages
      await queryInterface.changeColumn('order_items', 'packages', {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of packages (can be fractional)'
      });
      
      await queryInterface.changeColumn('order_items', 'quantity', {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Total pieces (calculated from packages × VPE)'
      });
      
      // Update angebot_items table if it exists
      try {
        await queryInterface.changeColumn('angebot_items', 'packages', {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 0,
          comment: 'Number of packages (can be fractional)'
        });
        
        await queryInterface.changeColumn('angebot_items', 'quantity', {
          type: DataTypes.FLOAT,
          allowNull: false,
          comment: 'Total pieces (calculated from packages × VPE)'
        });
      } catch (error) {
        console.log('ℹ️ angebot_items table not found or already updated, skipping...');
      }
      
      console.log('✅ Migration to packet-based system completed successfully');
      
    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back packet-based system migration...');
    
    try {
      // Revert products table changes
      await queryInterface.changeColumn('products', 'package', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
      
      await queryInterface.changeColumn('products', 'quantity', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
      
      // Revert order_items table changes
      await queryInterface.changeColumn('order_items', 'packages', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
      
      await queryInterface.changeColumn('order_items', 'quantity', {
        type: DataTypes.INTEGER,
        allowNull: false
      });
      
      // Revert angebot_items table changes if it exists
      try {
        await queryInterface.changeColumn('angebot_items', 'packages', {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        });
        
        await queryInterface.changeColumn('angebot_items', 'quantity', {
          type: DataTypes.INTEGER,
          allowNull: false
        });
      } catch (error) {
        console.log('ℹ️ angebot_items table not found, skipping rollback...');
      }
      
      console.log('✅ Rollback completed successfully');
      
    } catch (error) {
      console.error('❌ Error during rollback:', error);
      throw error;
    }
  }
};
