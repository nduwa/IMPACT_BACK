import { DataTypes } from "sequelize";
import sequelize from "../database/connectDb.js";

const Mobile_App = sequelize.define("rtc_mobile_app_access_control", {
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
  moduleid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  view_record: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  add_record: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  delete_record: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  edit_record: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.ENUM('0','1'),
    defaultValue:'0',
    allowNull: false,
  },
});
export default Mobile_App;
