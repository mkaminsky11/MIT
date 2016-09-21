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
var nodeData = JSON.parse(fs.readFileSync("json/data.json"));

app.get('/', function (req, res) {
  res.render('index.html', {
  	buildings: json.buildings
  });
});

app.get('/data/:building/:floor', function(req,res){
	var _data = {
		items: {},
		connections: []
	};
	if(nodeData[req.params.building] && nodeData[req.params.building][req.params.floor]){
		_data = nodeData[req.params.building][req.params.floor];
	}
	res.send(JSON.stringify(_data));
});

app.post('/update', function(req, res){
	var data = {
		floor: req.body.floor,
		building: req.body.building,
		items: req.body.items,
		connections: req.body.connections
	};
	if(nodeData[req.body.building]){
		//all good, continue
	}
	else{
		nodeData[req.body.building] = {};
	}
	nodeData[req.body.building][req.body.floor] = data;
	fs.writeFile("json/data.json", JSON.stringify(nodeData), function (err) {
		if(!err){
			res.send({
				err: true
			});
		}
		else{
			res.send({
				err: false
			});
		}
	});
});

app.listen(3000, function () {
});

function findPath(room1, room2){
	room1 = room1.split("-");
	room2 = room2.split("-");
	var bld1 = room1[0];
	var bld2 = room2[0];
	room1 = room1[1]
	room2 = room2[1]
	var floor1 = 0
	var floor2 = 0
	for(var i = 0; i < room1.length; i++){
		if(isNaN(room1.charAt(i)) === false){
			floor1 = room1.charAt(i);
			break;
		}
	}
	for(var j = 0; j < room2.length; j++){
		if(isNaN(room2.charAt(j)) === false){
			floor2 = room2.charAt(j);
			break;
		}
	}

	var id1 = getId(bld1, floor1, room1);
	var id2 = getId(bld2, floor2, room2);
}

function getId(building, floor, room){
	var all_items = nodeData[building][floor].items;
	for id in all_items{
		if(all_items[id].name === "room"){
			return id;
		}
	}
	return null;
}