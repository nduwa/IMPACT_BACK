import { DataTypes } from 'sequelize';
import sequelize from '../database/connectDb.js';

const Proccessing = sequelize.define('rtc_deliveries_processing',{
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    created_at:{
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull:false
    },
    deliveryid:{
        type: DataTypes.STRING,
        allowNull: false
    },
    delivery_weight:{
        type: DataTypes.STRING,
        allowNull: false
    },
    delivery_bags:{
        type: DataTypes.STRING,
        allowNull: false
    },
    loaded_Weight:{
        type: DataTypes.STRING,
        allowNull: false
    },
    trans_weight:{
        type: DataTypes.STRING,
        allowNull: false
    },
    status:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    
});

export default Proccessing;
