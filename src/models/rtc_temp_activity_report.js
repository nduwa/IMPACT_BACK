import { DataTypes } from "sequelize";
import sequelize from "../database/connectDb.js";

const ActivityReport = sequelize.define("temp_activity_report", {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
    __kp_Report:{
        type: DataTypes.STRING,
        allowNull: false
    },
    _kf_Staff: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    _kf_User: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    _kf_Station: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    _kf_Supplier: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    CW_Name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    farmers: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    women: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    men: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    distributedKgs: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    coffee: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shade: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    grevelia: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    leucaena: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    markhamia: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    umuhumuro: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    croton: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    acacia: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    polyscias: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    caliandra: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("0", "1"),
      allowNull: false,
      defaultValue: "0",
    },
  },
  {
    timestamps: false, 
  }
);

export default ActivityReport;
