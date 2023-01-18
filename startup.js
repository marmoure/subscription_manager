const app = require('./express');
const sequelize = require('./sequelize');

async function assertDatabaseConnectionOk() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

async function startServer() {
    await assertDatabaseConnectionOk();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

startServer();

