var express = require('express');
var app = express();
app.use(express.static('./build/development'));
app.listen(5555);

