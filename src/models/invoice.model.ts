import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InvoiceAttributes {
  id: number;
  orderId: number;
  number: string; // external invoice number visible to customer
  date: Date;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  pdfPath: string; // filesystem or URL where PDF is stored
  createdBy: number | null;
  updatedBy: number | null;
}

type InvoiceCreationAttributes = Optional<InvoiceAttributes, 'id' | 'createdBy' | 'updatedBy' | 'pdfPath' | 'totalNet' | 'totalVat' | 'totalGross'>;

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
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

Invoice.init(
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
  { sequelize, tableName: 'invoices' }
);

export default Invoice;

// Define associations after both models are defined to avoid circular deps
import Order from './order.model';

Invoice.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(Invoice, { foreignKey: 'orderId', as: 'invoices' });
