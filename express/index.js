const express = require('express');
const router = require('./router/router');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(router);

app.use((req, res, next) => {
    res.send('Hello World');
});

module.exports = app;