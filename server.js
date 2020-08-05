var express = require('express');
var app = express();

app.use('/', express.static(__dirname));

let port = 8888;
app.listen(port, function () {
  console.log('Success!Please visit http://localhost:'+port +"/example/index.html");
});