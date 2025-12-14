import { DataTypes } from "sequelize";
import sequelize from "../database/connectDb.js";

const Field_farmer = sequelize.define("rtc_field_farmers", {
    id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  _kf_Supplier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  _kf_Staff: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  _kf_User: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  _kf_Station: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  CW_Name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  source_ID: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  farmer_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Year_Birth: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  National_ID: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Marital_Status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Group_ID: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  village: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cell: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  province: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Trees: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  Trees_Producing: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  number_of_plots: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  Skills: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Math_Skills: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  education_level: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Pending',
  },
});
sequelize.sync();
export default Field_farmer;

