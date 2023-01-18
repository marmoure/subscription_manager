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

// add a client
router.post('/api/subscription', async (req, res) => {
    const {hardwareID, name, phoneNum} = req.body;
    const client = await clientModel.findOne({where: {hardwareID}});
    if (client === null) {
        await clientModel.create({hardwareID, name, phoneNum, clients: 0});
         return res.json({
            created: 'ok',
        });
    }
    res.sendStatus(404);
});

// delete a client
router.delete('/api/subscription', async (req, res) => {
    const {hardwareID} = req.body;
    const client = await clientModel.findOne({where: {hardwareID}});
    if (client !== null) {
        await client.destroy();
        return res.json({
            deleted: 'ok',
        });
    }
    res.sendStatus(404);
});

module.exports = router;