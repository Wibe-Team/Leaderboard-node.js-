const express = require('express');

const Router = require('./router');

let app = express();

Router(app);

app.listen(3333, function () {
    console.log('Listening on port 80!');
});







