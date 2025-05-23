var express = require('express');
var app = express();
app.use(express.static('./deploy'));
app.listen(8081);

