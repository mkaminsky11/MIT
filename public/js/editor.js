var floors = [];
var building = Number($("#buildings").find(":selected").text());
var floor = 0;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var svg = document.getElementById('svg');
var pdf_viewport = null;

var storage = [];

$(document).ready(function(){
	floors = $("#buildings").find(":selected").attr("data-floors").split(",");
	$("#floors").html("");
	for(var i = 0; i < floors.length; i++){
		floors[i] = Number(floors[i]);
		$("#floors").append("<option value='" + floors[i] + "'>" + floors[i] + "</option>")
	}
	floor = Number($("#floors").find(":selected").text());
	svg.addEventListener('click', function (event) {
		tool.do(event.offsetX, event.offsetY);
	}, false);
	svg.addEventListener('mousemove', function (event) {
		tool.hover(event.offsetX, event.offsetY);
	}, false);	
	loadFloor();
});

$(window).resize(function(){
});


function loadFloor(){
	building = Number($("#buildings").find(":selected").text());
	floor = Number($("#floors").find(":selected").text());
	var url = "/plans/" + building + "_" + floor + ".pdf";
	PDFJS.getDocument(url).then(function(pdf) {
		pdf.getPage(1).then(function(page) {

			canvas.height = $(canvas).height() * 3
			canvas.width = $(canvas).width() * 3
			$(svg).attr("height", canvas.height / 3);
			$(svg).attr("width", canvas.width / 3);

			context.clearRect(0, 0, canvas.width, canvas.height);
			$("#data-lines, #data-points, #data-result").html("");
			var viewport = page.getViewport(1);
			var scale = canvas.width / viewport.width;
			var scaledViewport = page.getViewport(scale);
			pdf_viewport = scaledViewport;
			var ratio = pdf_viewport.height / pdf_viewport.width;

			$(canvas).css("height",($(canvas).width() * ratio));
			canvas.height = $(canvas).height() * 3
			canvas.width = $(canvas).width() * 3
			svg.width = canvas.width / 3
			svg.height = canvas.height / 3
			
			$(svg).css("height", $(canvas).height());
			$(svg).css("width", $(canvas).width());
			$(svg).attr("height", $(canvas).height());
			$(svg).attr("width", $(canvas).width());
			svg.setAttribute("viewBox", "0 0 " + $(canvas).width() + " " + $(canvas).width() * ratio);

			var renderContext = {
			  canvasContext: context,
			  viewport: scaledViewport
			};
			page.render(renderContext);

			$.ajax({
			  type: "GET",
			  url: "/data/" + building + "/" + floor,
			  data: {
			  },
			  success: function(data){
			  	var items = data;
			  	for(var i = 0; i < items.length; i++){
			  		items[i].data = denormalize(items[i].data);
			  		if(items[i].type === "line"){
			  			createLineNode(items[i].data.x1,items[i].data.y1,items[i].id);
			  			createLine(items[i].data.x1,items[i].data.y1,items[i].data.x2,items[i].data.y2,items[i].id);
			  		}
			  		else if(items[i].type === "node"){
			  			createNode(items[i].data.x,items[i].data.y,items[i].id,items[i].data.node,items[i].data.name)
			  		}
			  	}
			  },
			  error: function(e){

			  }
			});
		});
	});
}


var counter = null;
var tool = {}
tool.tool = "select"
tool.node = {}
tool.select = {
	id: null
};
tool.line = {
	start: null
};
tool.elevator = {} 
tool.stairs = {}
tool.eraser = {}
tool.node.start = function(){
	tool.reset();
	$(".node-hover").css("display","block");
	tool.tool = "node";
};
tool.select.start = function(){
	tool.reset();
	tool.tool = "select";
};
tool.line.start = function(){
	tool.reset();
	$(".node-hover").css("display","block");
	tool.tool = "line";
	tool.node.type = "room";
}
tool.eraser.start = function(){
	tool.reset();
	tool.tool = "eraser";
}
tool.reset = function(){
	$(".node-hover").css("display","none");
	$(".line-hover").css("display","none");
	$("#info").css("display","none");
	tool.line.first = null;
}
tool.do = function(x,y){
	var _x = x;
	var _y = y;
	if(tool.tool === "node"){
		x = Number($(".node-hover").attr("cx"));
		y = Number($(".node-hover").attr("cy"));
		counter = newId(x,y);
		createNode(x,y,counter,tool.node.type,"");
		newNode(x,y,counter, "", tool.node.type);
	}
	else if(tool.tool === "line"){
		x = Number($(".node-hover").attr("cx"));
		y = Number($(".node-hover").attr("cy"));
		if(tool.line.first === null){
			tool.line.first = {x:x, y:y};
			counter = newId(x,y);
			createLineNode(x,y,counter);
			$(".line-hover").css("display","block");
			d3.select(".line-hover").attr("x1", x).attr("y1", y);
		}
		else{
			x = Number($(".line-hover").attr("x2"));
			y = Number($(".line-hover").attr("y2"));
			createLine(tool.line.first.x,tool.line.first.y,x,y,counter);
			newLine(tool.line.first.x,tool.line.first.y,x,y,counter);
			tool.line.first = null;
			$(".line-hover").css("display","none");
		}
	}
};
tool.hover = function(x,y){
	var x_x = x * 1000 / Number($("#svg").attr("width"))
	var y_y = y * 1000 / Number($("#svg").attr("height"))
	d3.select(".node-hover").attr("cx", x).attr("cy", y);
	d3.select(".line-hover").attr("x2", x).attr("y2", y);
	if(tool.tool === "line"){
		$(".node,.line-node").each(function(i){
				var d = (pointDistance(this, x, y));
				if(d.dist <= 12){
					d3.select(".node-hover").attr("cx", d.x).attr("cy", d.y);
					d3.select(".line-hover").attr("x2", d.x).attr("y2", d.y);
				}
		});
	}

	if(tool.tool === "node" || tool.tool === "line"){
		$(".line").each(function(i){
				var d = (lineDistance(this, x, y));
				if(d.dist <= 12){
					var point = closest(this, x, y, d.dist);
					if(point !== null){
						d3.select(".node-hover").attr("cx", point.x).attr("cy", point.y);
						d3.select(".line-hover").attr("x2", point.x).attr("y2", point.y);
					}
				}
		});

		$(".node,.line-node").each(function(i){
				var d = (pointDistance(this, x, y));
				if(d.dist <= 12){
					d3.select(".node-hover").attr("cx", d.x).attr("cy", d.y);
					d3.select(".line-hover").attr("x2", d.x).attr("y2", d.y);
				}
		});
	}
}

function pointDistance(point, x0, y0){
	var x1 = Number($(point).attr("cx"));
	var y1 = Number($(point).attr("cy"));

	return {
		dist: Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)),
		x: x1,
		y: y1
	}
}

function createNode(x,y,id,type,name){
	storage.push({
		building: building,
		floor: floor,
		type: "node",
		id: id,
		data: {
			x: x,
			y: y,
			node: type,
			name: name
		}
	});
	var color = "blue";
	if(type === "stairs" || type === "elevator"){
		color = "yellow";
	}
	d3.select("#data-points").append("circle").attr("cx", x).attr("class","node").attr("data-type","room").attr("cy", y).attr("r", 5).style("fill", color).attr("data-id", id);
	var last_one = $("#svg circle.node").last().get(0);
	last_one.addEventListener('click', function (event) {
		if(tool.tool === "select"){
			tool.select.id = $(this).attr("data-id");
			$("#info").css("display","flex");
			$("#info").css("left", event.offsetX);
			$("#info").css("top", event.offsetY + 20);
			for(var i = 0; i < storage.length; i++){
				if(storage[i].id === tool.select.id){
					$("#info #type").val(storage[i].data.node);
					$("#info #name").val(storage[i].data.name);
				}
			}
		}
		else if(tool.tool === "eraser"){
			var id = $(this).attr("data-id");
			$("[data-for-id='" + id + "']").remove();
			deleteObject(id);
			$(this).remove();
		}
	}, false);

	last_one.addEventListener('mousemove', function (event) {
		if(tool.tool === "select"){

		}
	}, false);
}

function createLine(x1, y1, x2, y2, id){
	storage.push({
		building: building,
	  	floor: floor,
	  	type: "line",
	  	id: id,
	  	data:{
		  	x1: x1,
		  	y1: y1,
		  	x2: x2,
		  	y2: y2
		}
	});
	d3.select("#data-lines").append("line").attr("x2", x2).attr("class","line").attr("y2", y2).attr("x1",x1).attr("y1",y1).attr("stroke-width",3).attr("stroke","green").attr("data-id",id);
	d3.select("#data-lines").append("circle").attr("cx", x2).attr("class","line-node").attr("data-type","line").attr("cy", y2).attr("r", 5).style("fill", "green").attr("data-for-id",id);
	var last_one = $("#svg line.line").last().get(0);
	last_one.addEventListener('click', function (event) {
		if(tool.tool === "eraser"){
			var id = $(this).attr("data-id");
			$("[data-for-id='" + id + "']").remove();
			deleteObject(id);
			$(this).remove();
		}
	}, false);
}

function createLineNode(x,y,id){
	d3.select("#data-lines").append("circle").attr("cx", x).attr("class","line-node").attr("data-type","line").attr("cy", y).attr("r", 5).style("fill", "green").attr("data-for-id",id);
}

function lineDistance(line, x0, y0){
	var x1 = Number($(line).attr("x1"));
	var y1 = Number($(line).attr("y1"));
	var x2 = Number($(line).attr("x2"));
	var y2 = Number($(line).attr("y2"));
	var slope = (y2 - y1)/(x2 - x1)
	var h = y2 - slope * x2;
	var c = -1 * h;
	var a = -1 * slope;
	var b = 1

	var dist = Math.abs(a * x0 + b * y0 + c) / Math.sqrt(Math.pow(a,2) + Math.pow(b,2));
	return {
		dist: dist,
		a: a,
		b: b,
		c: c,
		y0: y0,
		x0: x0,
		x1: x1,
		y2: y2,
		x2: x2,
		y2: y2
	};
}

function closest(line, x, y, distance){
	var x1 = Number($(line).attr("x1"));
	var y1 = Number($(line).attr("y1"));
	var x2 = Number($(line).attr("x2"));
	var y2 = Number($(line).attr("y2"));
	x = Number(x);
	y = Number(y);

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

function newId(x,y){
	return "" + building + "_" + floor + "_" + x.toFixed(0) + "_" + y.toFixed(0) + "_" + getRandomInt(0,1000);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function save(){
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function saveSelect(){
	var id = tool.select.id;
	updateNode(id, $("#info #name").val(), $("#info select").val());
}

function closeSelect(){
	$("#info").css("display","none");
}

function normalize(obj){
	for(key in obj){
		if(key.charAt(0) === "x"){
			obj[key] = obj[key]* 1000 / Number($("#svg").attr("width"))
		}
		else if(key.charAt(0) === "y"){
			obj[key] = obj[key] * 1000 / Number($("#svg").attr("height"))
		}
	}
	return obj;
}

function denormalize(obj){
	for(key in obj){
		if(key.charAt(0) === "x"){
			obj[key] = (obj[key] * Number($("#svg").attr("width")) / 1000);
		}
		else if(key.charAt(0) === "y"){
			obj[key] = (obj[key] * Number($("#svg").attr("height")) / 1000);
		}
	}
	return obj;
}

function getRoomInfo(room1, room2){
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

	return {
		build1: bld1,
		build2: bld2,
		floor1: floor1,
		floor2: floor2,
		room1: room1,
		room2: room2
	}
}