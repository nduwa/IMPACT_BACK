import { DataTypes } from 'sequelize';
import sequelize from "../database/connectDb.js";

const Mobile_App_Modules = sequelize.define("rtc_mobile_app_modules", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    allowNull: false,
  },
  module_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("0","1"),
    defaultValue: "0",
    allowNull: false,
  }
});
export default Mobile_App_Modules;
