var express = require('express');
var app = express();
app.use(express.static('./docs'));
app.listen(8081);

