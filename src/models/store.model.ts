// models/store.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

export interface StoreAttributes {
  id: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  userId: number;
  status: 'active' | 'inactive';
}

interface StoreCreationAttributes extends Optional<StoreAttributes, 'id'> {}

export class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
  public id!: number;
  public name!: string;
  public address!: string;
  public city!: string;
  public postalCode!: string;
  public userId!: number;
  public status!: 'active' | 'inactive';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Store.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'stores',
    timestamps: true,
    indexes: [
      {
        fields: ['postalCode'],
      }
    ]
  }
);

// Associations
User.hasOne(Store, { foreignKey: 'userId', as: 'store' });
Store.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Store;