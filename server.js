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

app.get('/editor', function (req, res) {
  res.render('editor.html', {
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

app.post('/path', function(req, res){
	var info = req.body.info;
	var id1 = getId(info.build1, info.floor1, info.room1);
	var id2 = getId(info.build2, info.floor2, info.room2);
	if(id1 === null || id2 === null){
		res.send({
			err: true,
			message: "Points not found!"
		});
	}else{
		var start = {
			build: info.build1,
			floor: info.floor1,
			room: info.room1,
			id: id1
		};
		var finish = {
			build: info.build2,
			floor: info.floor2,
			room: info.room2,
			id: id2
		};
		var _p = new pathFinder(start,finish,res);
		_p.startFindPath();
	}

});

app.listen(3000, function () {
});

function getId(building, floor, room){
	var all_items = nodeData[building][floor].items;
	for(id in all_items){
		if(all_items[id].name === room){
			return id;
		}
	}
	return null;
}

function clone(obj){
	return (JSON.parse(JSON.stringify(obj)));
}

function pathFinder(start, finish, res){
	this.start = start;
	this.finish = finish;
	this.build = start.build;
	this.floor = start.floor;
	this.foundPaths = [];
	this.res = res;
};

pathFinder.prototype.startFindPath = function(){
	this.findPath(this.start, this.build, this.floor, [this.start.id]);
}

pathFinder.prototype.findPath = function(initial, build, floor, pathSoFar){
	//unvisited = unvisited on floor
	//unvisited array is just a cloned nodeData.items[build][floor] initially

	/*

	for now, just give A path

	*/

	var connected = nodeData[build][floor].items[initial.id].connected;
	var unvisited_neighbors = {};
	for(var i = 0; i < connected.length; i++){
		//find all unvisited neighbors
		if(pathSoFar.indexOf(connected[i]) === -1){
			var nextPath = [];
			for(var j = 0; j < pathSoFar.length; j++){
				nextPath.push(pathSoFar[j]);
			}
			nextPath.push(connected[i]);

			if(connected[i] === this.finish.id){ 	//if we're done
				for(var k = 0; k < nextPath.length; k++){
					nextPath[k] = this.findItem(build, floor, nextPath[k]);
				}
				this.res.send({
					data: "found it!",
					path: (nextPath)
				});
				return;
			}
			else{
				initial = {
					id: connected[i]
				};
				this.findPath(initial, build, floor, nextPath);
			}
		}
	}
}

pathFinder.prototype.shorten = function(array){ //WIP
	var i = 0;
	var length = array.length;
	while(i < length-1){
		var lastIndexConnected = i+1;
		for(var j = i+1; j < array.length; j++){
			if(array[i].connected.indexOf(array[j].id) !== -1){
				lastIndexConnected = j;
			}
		}
		//remove everything -> num = i+1 to (lastIndex - i + 1)
		array.splice(i+1, (lastIndexConnected - (i+1)));
		length = array.length;
		i++;
	}
	return array;
};

pathFinder.prototype.findItem = function(build, floor, id){
	return nodeData[build][floor].items[id];
}

