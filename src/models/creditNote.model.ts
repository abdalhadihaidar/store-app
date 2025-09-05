import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CreditNoteAttributes {
  id: number;
  orderId: number;
  number: string;
  date: Date;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  pdfPath: string;
  createdBy: number | null;
  updatedBy: number | null;
}

type CreditNoteCreationAttributes = Optional<CreditNoteAttributes, 'id' | 'createdBy' | 'updatedBy' | 'pdfPath' | 'totalNet' | 'totalVat' | 'totalGross'>;

export class CreditNote extends Model<CreditNoteAttributes, CreditNoteCreationAttributes> implements CreditNoteAttributes {
  public id!: number;
  public orderId!: number;
  public number!: string;
  public date!: Date;
  public totalNet!: number;
  public totalVat!: number;
  public totalGross!: number;
  public pdfPath!: string;
  public createdBy!: number | null;
  public updatedBy!: number | null;
}

CreditNote.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    number: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    totalNet: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalVat: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalGross: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    pdfPath: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'credit_notes' }
);

export default CreditNote;

import Order from './order.model';

CreditNote.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(CreditNote, { foreignKey: 'orderId', as: 'creditNotes' });
