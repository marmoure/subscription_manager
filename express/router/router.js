const {Router} = require('express');
const clientModel = require('../../sequelize/models/client.model');

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello World');
});

router.get('/api/subscription', async (req, res) => {
    const {hardwareID} = req.query;
    const client = await clientModel.findOne({where: {hardwareID}});

    res.json({
        subscription: client === null,
        clients: client === null ? 0 : client.clients,
    });
});

module.exports = router;