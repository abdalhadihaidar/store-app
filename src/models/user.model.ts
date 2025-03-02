import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the UserAttributes interface
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
  resetPasswordToken?: string|null; // Add this
  resetPasswordExpires?: Date|null; // Add this
}

// Define the UserCreationAttributes interface (for creation, `id` is optional)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  id!: number;
  name!: string;
  email!: string;
  password!: string;
  role!: 'admin' | 'client';
  resetPasswordToken!: string|null; // Add this
  resetPasswordExpires!: Date|null; // Add this
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'client'), allowNull: false },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  { sequelize, tableName: 'users' }
);

export default User;
import Order from './order.model';
// Add this to your User model file
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders'
});