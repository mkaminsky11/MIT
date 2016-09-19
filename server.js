var express = require('express');
var app = express();
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var fs = require('fs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
nunjucks.configure('views', {
	autoescape: true,
	express: app
});

var json = JSON.parse(fs.readFileSync("data/floor.json"));

app.get('/', function (req, res) {
  res.render('index.html', {
  	buildings: json.buildings
  });
});

app.listen(3000, function () {
});