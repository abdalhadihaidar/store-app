import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class AngebotItem extends Model {
  public id!: number;
  public angebotId!: number;
  public productId!: number;
  public quantity!: number;
  public packages!: number;
  public unitPrice!: number; // Price per unit (can be adjusted)
  public taxRate!: number; // Tax percentage
  public taxAmount!: number; // Calculated tax amount
  public totalPrice!: number; // Total price including tax
  public unitPerPackageSnapshot!: number; // Snapshot of units per package at time of creation
  public notes!: string | null; // Additional notes for this item

  // Association properties
  public angebot?: any;
  public product?: any;
}

AngebotItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    angebotId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    packages: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    taxRate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.15 }, // Default 15% tax
    taxAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    unitPerPackageSnapshot: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, tableName: 'angebot_items' }
);

export default AngebotItem;

// Associations are defined in models/index.ts
