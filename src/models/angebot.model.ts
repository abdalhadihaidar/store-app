import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AngebotAttributes {
  id: number;
  orderId: number | null;
  angebotNumber: string; // External angebot number visible to customer (e.g., 2021-003-001)
  date: Date;
  validUntil: Date; // Validity period for the offer
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  totalNet: number;
  totalVat: number;
  totalGross: number;
  notes: string | null; // Additional notes or terms
  pdfPath: string | null; // Path to generated PDF file
  createdBy: number | null;
  updatedBy: number | null;
  customerId: number | null; // Reference to customer for direct angebot creation
  storeId: number;
}

type AngebotCreationAttributes = Optional<AngebotAttributes, 'id' | 'createdBy' | 'updatedBy' | 'notes' | 'pdfPath' | 'customerId' | 'totalNet' | 'totalVat' | 'totalGross'>;

export class Angebot extends Model<AngebotAttributes, AngebotCreationAttributes> implements AngebotAttributes {
  public id!: number;
  public orderId!: number | null;
  public angebotNumber!: string;
  public date!: Date;
  public validUntil!: Date;
  public status!: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  public totalNet!: number;
  public totalVat!: number;
  public totalGross!: number;
  public notes!: string | null;
  public pdfPath!: string | null;
  public createdBy!: number | null;
  public updatedBy!: number | null;
  public customerId!: number | null;
  public storeId!: number;

  // Association properties
  public order?: any;
  public customer?: any;
  public store?: any;
  public items?: any[];
}

Angebot.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: true }, // Can be null for direct angebot creation
    angebotNumber: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    validUntil: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
      defaultValue: 'draft'
    },
    totalNet: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalVat: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalGross: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    pdfPath: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    customerId: { type: DataTypes.INTEGER, allowNull: true },
    storeId: { type: DataTypes.INTEGER, allowNull: false }
  },
  { sequelize, tableName: 'angebots' }
);

export default Angebot;

// Associations are defined in models/index.ts
