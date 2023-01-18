const path = require('path');
const {Sequelize} = require('sequelize');


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'data/database.sqlite'),
    logging: false,
});


const modelDefiners = [
    require('./models/client.model'),
];

for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

module.exports = sequelize;