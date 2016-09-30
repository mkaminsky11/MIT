var express = require('express');
var app = express();
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var mongoose = require('mongoose');
var shortid = require('shortid');

mongoose.connect('mongodb://localhost/MIT');

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
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("success");
});


var pointSchema = mongoose.Schema({
    floor: String,
    building: String,
    type: String, //node or line
    data: Object,
    id: String
});

var junctionSchema = mongoose.Schema({
	points: Array,
	id: String,
	type: String,
	name: String
});

var point = mongoose.model('points', pointSchema);
var junction = mongoose.model('junctions', junctionSchema);

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
	point.find({
		building: req.params.building,
		floor: req.params.floor
	},function(err, results){
		res.send(results);
	});
});

app.post('/new', function(req,res){
	var newPoint = new point({
		id: req.params.id,
		building: req.body.building,
		floor: req.body.floor,
		type: req.body.type,
		id: req.body.id,
		data: req.body.data
	});
	newPoint.save(function(err,newObject){
		return;
	});
});

app.post('/delete', function(req,res){
	point.remove({
		floor: req.body.floor,
		building: req.body.building,
		id: req.body.id
	}, function(err, removedObject){
		removeFromJunction(req,res,req.body.id,function(err,result){
		});
	});
});

app.post('/update', function(req, res){
	point.find({
		id: req.body.id,
		floor: req.body.floor,
		building: req.body.building	
	}, function(err, result){
		if(result.length > 0){
			var newData = clone(result[0].data);
			for(key in req.body.data){
				newData[key] = req.body.data[key]
			};
			point.update({
				id: req.body.id,
				floor: req.body.floor,
				building: req.body.building
			},{
				$set: {
					data: newData
				}
			}, function(err, result){
			});
		}
	});
});

app.post('/path', function(req, res){
	var info = req.body.info;
	point.find({
		building: info.build1,
		floor: info.floor1,
		'data.name': info.build1 + "-" + info.room1
	},function(err1, result1){
		point.find({
			building: info.build2,
			floor: info.floor2,
			'data.name': info.build2  + "-" + info.room2
		},function(err2,result2){
			if(result1.length === 1 && result2.length === 1){
				var start = result1[0];
				var finish = result2[0];
				var _p = new pathFinder(start,finish,res);
				_p.startFindPath();
			}
			else{
				res.send({
					err: true,
					message: "Points not found"
				});
			}
		});
	});
});

app.get('/junctions/all', function(req,res){
	junction.find({},function(err,result){
		res.send(result);
	});
});

app.post('/junctions/new', function(req,res){
	var juncArray = [];
	if(req.body.points){
		juncArray = req.body.points;
	}
	var junc = new junction({
		points: juncArray,
		id: shortid.generate() + "-" + shortid.generate(),
		type: req.body.type,
		name: req.body.name
	});
	junc.save(function(err,result){
	});
});

app.post('/junctions/delete', function(req,res){
	removeFromJunction(req,res,req.body.id,function(err,result){
	});
})

app.post('/junctions/update', function(req,res){
	removeFromJunction(req,res,req.body.id,function(err,result){
		addToJunction(req,res,req.body.id,req.body.junc,function(err,result){
		});
	});
});

function removeFromJunction(req,res,id,callback){
	junction.find({},function(err,result){
		for(var i = 0; i < result.length; i++){
			var index = result[i].points.indexOf(id);
			if(index !== -1){
				result[i].points.splice(index,1);
				junction.update({
					id: result[i].id
				},{
					$set: {
						points: result[i].points
					}
				}, function(err,result){
				});
			}
		}
		callback(err,result);
	});	
}

function addToJunction(req,res,id,junc,callback){
	junction.find({
		id: junc
	},function(err,result){
		if(typeof result === typeof []){
			result = result[0]
		}
		result.points.push(id);
		junction.update({
			id: junc
		},{
			$set: {
				points: result.points
			}
		}, function(err,result){
		});
		callback(err,result);
	});
}

/*
new item, add to junction [done] /junctions/new
new junction [done] /junctions/new
new remove item from junctions [done] /junctions/delete
*/

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
	var start_build = this.start.building;
	var start_floor = this.start.floor;
	var $this = this;
	point.find({
		floor: start_floor,
		building: start_build
	}, function(err, data){
		var unvisited = [];
		for(var i = 0; i < data.length; i++){
			if(data[i].id !== $this.start.id){
				unvisited.push(data[i]);
			}
		}
		$this.findPath($this.start, unvisited, [$this.start],[{
			x: Number($this.start.data.x),
			y: Number($this.start.data.y),
			building: $this.start.building,
			floor: $this.start.floor
		}]);
	});
}

pathFinder.prototype.findPath = function(initial, unvisitedOnFloor, pathSoFar, connectedPath){
	for(var i = 0; i < unvisitedOnFloor.length; i++){
		var nextPath = [];
		for(var j = 0; j < pathSoFar.length; j++){
			nextPath.push(pathSoFar[j]);
		}
		var nextConnected = [];
		for(var j = 0; j < connectedPath.length; j++){
			nextConnected.push(connectedPath[j]);
		}
		var _connected = this.areConnected(initial, unvisitedOnFloor[i]);
		nextConnected.push(_connected);
		nextPath.push(unvisitedOnFloor[i]);

		if(unvisitedOnFloor[i].id === this.finish.id){
			if(_connected.connected === true){
				this.res.send({
					data: "found it!",
					path: nextPath,
					connected: nextConnected
				});
				return;
			}
		}

		var unvisitedNow = [];
		for(var j = 0; j < unvisitedOnFloor.length; j++){
			if(j !== i){
				unvisitedNow.push(unvisitedOnFloor[j]);
			}
		}

		if(unvisitedOnFloor[i].type === "line" && _connected.connected === true){
			//check if connected to the current thing
			this.findPath(unvisitedOnFloor[i], unvisitedNow, nextPath, nextConnected);
		}
	}
}

function lineDistance(x1,y1,x2,y2,x0,y0){
	var slope = (y2 - y1)/(x2 - x1)

	// y = mx + h
	// h = y - mx
	var h = y2 - slope * x2;

	// ax + by + c = 0
	// -mx + y -h = 0
	var c = -1 * h;
	var a = -1 * slope;
	var b = 1

	var dist = Math.abs(a * x0 + b * y0 + c) / Math.sqrt(Math.pow(a,2) + Math.pow(b,2));
	return dist;
}

function closest(x1,y1,x2,y2, x, y){
	var distance = lineDistance(x1,y1,x2,y2,x,y);
	var normal = [-1 * y2 + y1, x2 - x1];
	var magnitude = Math.sqrt(Math.pow(normal[0],2) + Math.pow(normal[1],2));
	var ratio = distance / magnitude;
	normal[0] = normal[0]*ratio;
	normal[1] = normal[1]*ratio;

	var _x = x + normal[0];
	var _y = y + normal[1];

	return {
		x: _x,
		y: _y
	}
}

function pointDistance(x1,y1,x2,y2){
	return Math.pow(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
}

var minDist = 1;

pathFinder.prototype.areConnected = function(item1, item2){
	var floor = item1.floor;
	var building = item2.building;
	if(item1.type === "node" && item2.type === "node"){
		return {
			connected: false
		}
	}
	else if( (item1.type === "node" && item2.type === "line") || (item1.type === "line" && item2.type === "node") ){
		if(item1.type === "line"){
			var tmp = clone(item1);
			item1 = clone(item2);
			item2 = tmp;
		}

		item1 = item1.data;
		item2 = item2.data;

		var x1 = (Number(item2.x1));
		var x2 = (Number(item2.x2));
		var y1 = (Number(item2.y1));
		var y2 = (Number(item2.y2));
		var x = (Number(item1.x));
		var y = (Number(item1.y));

		var s = [x1,y1];
		var vector = [x2-x1,y2-y1];
		var diff = [x-x1,y-y1];
		var ratios = [diff[0]/vector[0], diff[1]/vector[1]];
		if(ratios[0] === ratios[1]){
			return {
				connected: true,
				x: x,
				y: y,
				floor: floor,
				building: building
			};
		}

		if(lineDistance(x1,y1,x2,y2,x,y) < minDist){
			return {
				connected: true,
				x: x,
				y: y,
				floor: floor,
				building: building
			};
		}

		return {
			connected: false
		};
	}
	else if(item1.type === "line" && item2.type === "line"){
		item1 = item1.data;
		item2 = item2.data;

		item1.x1 = two(Number(item1.x1));
		item1.x2 = two(Number(item1.x2));

		item1.y1 = two(Number(item1.y1));
		item1.y2 = two(Number(item1.y2));

		item2.x1 = two(Number(item2.x1));
		item2.x2 = two(Number(item2.x2));

		item2.y1 = two(Number(item2.y1));
		item2.y2 = two(Number(item2.y2));

		var m1 = (item1.y2-item1.y1)/(item1.x2-item1.x1);
		var m2 = (item2.y2-item2.y1)/(item2.x2-item2.x1);
		var b1 = item1.y1 - m1 * item1.x1;
		var b2 = item2.y1 - m2 * item2.x1;

		if(m1 === m2){
			return false; //parallel
		}

		var x_int = (b2-b1)/(m1-m2);
		x_int = two(x_int)
		var y_int = m1*x_int + b1;
		y_int = two(y_int);

		if(pointDistance(item1.x1,item1.y1,item2.x1,item2.y1) < minDist || pointDistance(item1.x1,item1.y1,item2.x2,item2.y2) < minDist){
			return {
				connected: true,
				x: item1.x1,
				y: item1.y1,
				floor: floor,
				building: building
			};
		}

		if(pointDistance(item1.x2,item1.y2,item2.x1,item2.y1) < minDist || pointDistance(item1.x2,item1.y2,item2.x2,item2.y2) < minDist){
			return {
				connected: true,
				x: item1.x2,
				y: item1.y2,
				floor: floor,
				building: building
			};
		}

		if(pointDistance(x_int,y_int,item1.x1,item1.y1) < minDist || pointDistance(x_int,y_int,item1.x2,item1.y2) < minDist || pointDistance(x_int,y_int,item2.x1,item2.y1) < minDist || pointDistance(x_int,y_int,item2.x2,item2.y2) < minDist){
			return {
				connected: true,
				x: x_int,
				y: y_int,
				floor: floor,
				building: building
			};
		}

		if(x_int < Math.min(item1.x1,item1.x2) || x_int > Math.max(item1.x1,item1.x2) || y_int < Math.min(item1.y1,item1.y2) || y_int > Math.max(item1.y1,item1.y2)){
			return {
				connected: false
			}
		}
		if(x_int < Math.min(item2.x1,item2.x2) || x_int > Math.max(item2.x1,item2.x2) || y_int < Math.min(item2.y1,item2.y2) || y_int > Math.max(item2.y1,item2.y2)){
			return {
				connected: false
			}
		}

		return {
			connected: true,
			x: x_int,
			y: y_int,
			floor: floor,
			building: building
		};
	}
};

function two(num){
	return Math.floor(num)
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

function findItem(build, floor, id){
	return nodeData[build][floor].items[id];
}