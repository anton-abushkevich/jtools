var express = require('express');
var app = express();
app.use(express.static('./build/prod'));
app.listen(8081);
