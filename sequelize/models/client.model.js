const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
    sequelize.define('client', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phoneNum: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        hardwareID: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        clients: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    })};