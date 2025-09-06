'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create angebots table
    await queryInterface.createTable('angebots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      angebotNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      validUntil: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'draft'
      },
      totalNet: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      totalVat: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      totalGross: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Create angebot_items table
    await queryInterface.createTable('angebot_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      angebotId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'angebots',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      packages: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      unitPrice: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      taxRate: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.15
      },
      taxAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      totalPrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      unitPerPackageSnapshot: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Add indexes for better performance
    await queryInterface.addIndex('angebots', ['angebotNumber']);
    await queryInterface.addIndex('angebots', ['status']);
    await queryInterface.addIndex('angebots', ['storeId']);
    await queryInterface.addIndex('angebots', ['customerId']);
    await queryInterface.addIndex('angebot_items', ['angebotId']);
    await queryInterface.addIndex('angebot_items', ['productId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('angebot_items');
    await queryInterface.dropTable('angebots');
  }
};
