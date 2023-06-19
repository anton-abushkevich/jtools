var express = require('express');
var app = express();
app.use(express.static('./build/dev'));
app.listen(8080);

