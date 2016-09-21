var floors = [];
var building = Number($("#buildings").find(":selected").text());
var floor = 0;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var svg = document.getElementById('svg');
var pdf_viewport = "";

$(document).ready(function(){
	floors = $("#buildings").find(":selected").attr("data-floors").split(",");
	$("#floors").html("");
	for(var i = 0; i < floors.length; i++){
		floors[i] = Number(floors[i]);
		$("#floors").append("<option value='" + floors[i] + "'>" + floors[i] + "</option>")
	}
	floor = Number($("#floors").find(":selected").text());
	canvas.height = $("#canvas").height() * 3
	canvas.width = $("#canvas").width() * 3
	$("#svg").attr("height", canvas.height / 3);
	$("#svg").attr("width", canvas.width / 3);

	svg.addEventListener('click', function (event) {
		tool.do(event.offsetX, event.offsetY);
	}, false);
	
	svg.addEventListener('mousemove', function (event) {
		tool.hover(event.offsetX, event.offsetY);
	}, false);	

	loadFloor();
});

$(window).resize(function(){
	canvas.height = $("#canvas").height() * 3
	canvas.width = $("#canvas").width() * 3

	$("#refresh").css("display","inline-block");
});


function loadFloor(){
	building = Number($("#buildings").find(":selected").text());
	floor = Number($("#floors").find(":selected").text());
	var url = "/plans/" + building + "_" + floor + ".pdf";
	PDFJS.getDocument(url).then(function(pdf) {
		pdf.getPage(1).then(function(page) {
			context.clearRect(0, 0, canvas.width, canvas.height);
			$("#data-lines, #data-points").html("");
			var viewport = page.getViewport(1);
			var scale = canvas.width / viewport.width;
			var scaledViewport = page.getViewport(scale);
			pdf_viewport = scaledViewport;


			var ratio = pdf_viewport.height / pdf_viewport.width;
			$("#svg").css("width", $("#canvas").width());
			$("#svg").css("height", ($("#canvas").width() * ratio));
			$("#svg").attr("width", $("#canvas").width());
			$("#svg").attr("height", $("#canvas").width() * ratio);
			svg.setAttribute("viewBox", "0 0 " + $("#canvas").width() + " " + $("#canvas").width() * ratio);

			/*
			height / width
			*/

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
			  	var _d = JSON.parse(data);
			  	console.log(_d);
			  	items = _d.items || {};
			  	connections = _d.connections || [];
			  	for(var i = 0; i < connections.length; i++){
			  		connections[i]["x"] = connections[i]["x"] * Number($("#svg").attr("width")) / 1000;
			  		connections[i]["y"] = connections[i]["y"] * Number($("#svg").attr("height")) / 1000;
			  	}
			  	for(key in items){
			  		var item = items[key];
					for(key2 in item){
						if(key2.charAt(0) === "x"){
							items[key][key2] = (items[key][key2] * Number($("#svg").attr("width")) / 1000);
						}
						else if(key2.charAt(0) === "y"){
							items[key][key2] = (items[key][key2] * Number($("#svg").attr("height")) / 1000);
						}
					}

					if(item.type === "line"){
						createLineNode(item.x1, item.y1, item.id);
						createLine(item.x1, item.y1, item.x2, item.y2, item.id);
					}
					else if(item.type === "node"){
						createNode(item.x, item.y, item.id);
					}
			  	}
			  },
			  error: function(e){

			  }
			});
		});
	});
}

function refreshFloor(){
	$("#refresh").css("display","none");
	var url = "/plans/" + building + "_" + floor + ".pdf";
	PDFJS.getDocument(url).then(function(pdf) {
		pdf.getPage(1).then(function(page) {
			context.clearRect(0, 0, canvas.width, canvas.height);
			var viewport = page.getViewport(1);
			var scale = canvas.width / viewport.width;
			var scaledViewport = page.getViewport(scale);
			pdf_viewport = scaledViewport;

			var ratio = pdf_viewport.height / pdf_viewport.width;

			$("#svg").css("width", $("#canvas").width());
			$("#svg").css("height", ($("#canvas").width() * ratio));

			var renderContext = {
			  canvasContext: context,
			  viewport: scaledViewport
			};
			page.render(renderContext);
		});
	});
}

var connections = [];
var items = {};
var snap = null;
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
		createNode(x,y,counter);
		items["" + counter] = {
			id: counter,
			type: "node",
			name: "",
			node: "room",
			x: x,
			y: y,
			connected: []
		};
		if(snap !== null){
			connections.push({
				between: [counter, snap.id],
				x: x,
				y: y
			});
			if(items[counter].connected.indexOf(snap.id) === -1){
				items[counter].connected.push(snap.id);
			}
			if(items[snap.id].connected.indexOf(counter) === -1){
				items[snap.id].connected.push(counter);
			}
		}
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
			tool.line.snap = snap;
		}
		else{
			x = Number($(".line-hover").attr("x2"));
			y = Number($(".line-hover").attr("y2"));
			createLine(tool.line.first.x,tool.line.first.y,x,y,counter);
			items["" + counter] = {
				id: counter,
				type: "line",
				x1: tool.line.first.x,
				y1: tool.line.first.y,
				x2: x,
				y2: y,
				connected: []
			};
			if(tool.line.snap !== null){
				connections.push({
					between: [counter, tool.line.snap.id],
					x: tool.line.first.x,
					y: tool.line.first.y
				});
				if(items[counter].connected.indexOf(tool.line.snap.id) === -1){
					items[counter].connected.push(tool.line.snap.id);
				}
				if(items[tool.line.snap.id].connected.indexOf(counter) === -1){
				items[tool.line.snap.id].connected.push(counter);
			}
			}
			if(snap !== null){
				connections.push({
					connected: [],
					between: [counter, snap.id],
					x: x,
					y: y
				});
				if(items[counter].connected.indexOf(snap.id) === -1){
					items[counter].connected.push(snap.id);
				}
				if(items[snap.id].connected.indexOf(counter) === -1){
					items[snap.id].connected.push(counter);
				}
			}
			tool.line.first = null;
			$(".line-hover").css("display","none");
		}
	}
};
tool.hover = function(x,y){
	d3.select(".node-hover").attr("cx", x).attr("cy", y);
	d3.select(".line-hover").attr("x2", x).attr("y2", y);
	snap = null;
	if(tool.tool === "line"){
		$(".node,.line-node").each(function(i){
				var d = (pointDistance(this, x, y));
				if(d.dist <= 12){
					d3.select(".node-hover").attr("cx", d.x).attr("cy", d.y);
					d3.select(".line-hover").attr("x2", d.x).attr("y2", d.y);

					snap = {
						id: $(this).attr("data-id") || $(this).attr("data-for-id")
					};
				}
		});
	}

	if(tool.tool === "node" || tool.tool === "line"){
		$(".line").each(function(i){
				var d = (lineDistance(this, x, y));
				if(d.dist <= 12){
					var point = closest(d);
					if(point !== null){
						d3.select(".node-hover").attr("cx", point.x).attr("cy", point.y);
						d3.select(".line-hover").attr("x2", point.x).attr("y2", point.y);

						snap = {
							id: $(this).attr("data-id") || $(this).attr("data-for-id")
						};
					}
				}
		});

		$(".node,.line-node").each(function(i){
				var d = (pointDistance(this, x, y));
				if(d.dist <= 12){
					d3.select(".node-hover").attr("cx", d.x).attr("cy", d.y);
					d3.select(".line-hover").attr("x2", d.x).attr("y2", d.y);

					snap = {
						id: $(this).attr("data-id") || $(this).attr("data-for-id")
					};
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

function createNode(x,y,id){
	d3.select("#data-points").append("circle").attr("cx", x).attr("class","node").attr("data-type","room").attr("cy", y).attr("r", 5).style("fill", "blue").attr("data-id", id);
	var last_one = $("#svg circle.node").last().get(0);
	last_one.addEventListener('click', function (event) {
		if(tool.tool === "select"){
			tool.select.id = $(this).attr("data-id");
			$("#info").css("display","flex");
			$("#info").css("left", event.offsetX);
			$("#info").css("top", event.offsetY + 20);
			$("#info select").val(items[tool.select.id].node);
			$("#info #name").val(items[tool.select.id].name);
		}
		else if(tool.tool === "eraser"){
			deleteConnections($(this).attr("data-id") || $(this).attr("data-for-id"));
			$(this).remove();
		}
	}, false);

	last_one.addEventListener('mousemove', function (event) {
		if(tool.tool === "select"){

		}
	}, false);
}

function createLine(x1, y1, x2, y2, id){
	d3.select("#data-lines").append("line").attr("x2", x2).attr("class","line").attr("y2", y2).attr("x1",x1).attr("y1",y1).attr("stroke-width",3).attr("stroke","green").attr("data-id",id);
	d3.select("#data-lines").append("circle").attr("cx", x2).attr("class","line-node").attr("data-type","line").attr("cy", y2).attr("r", 5).style("fill", "green").attr("data-for-id",id);
	var last_one = $("#svg line.line").last().get(0);
	last_one.addEventListener('click', function (event) {
		if(tool.tool === "eraser"){
			var id = $(this).attr("data-id");
			deleteConnections($(this).attr("data-id") || $(this).attr("data-for-id"));
			$(this).remove();
			$("[data-for-id='" + id + "']").remove();
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

	// y = mx + h
	// h = y - mx
	var h = y2 - slope * x2;

	// ax + by + c = 0
	// -mx + y -h = 0
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

function closest(data){
	var a = data.a;
	var b = data.b;
	var c = data.c;
	var x1 = data.x1;
	var y1 = data.y1;
	var x2 = data.x2;
	var y2 = data.y2;
	var x0 = data.x0;
	var y0 = data.y0;

	var x = ( b * (b * x0 - a * y0) - a * c ) / ( Math.pow(a,2) + Math.pow(b,2) );
	var y = ( a * (-1 * b * x0 + a * y0) - b * c ) / ( Math.pow(a,2) + Math.pow(b,2) );

	if(x < Math.min(x1,x2) || x > Math.max(x1,x2) || y < Math.min(y1,y2) || y > Math.max(y1,y2)){
		return null;
	}
	return {
		x: x,
		y: y
	};
}

function deleteConnections(id){
	var conn = [];
	for(var i = 0; i < connections.length; i++){
		if(connections[i].between.indexOf(id) === -1){
			conn.push(connections[i]);
		}
	}
	connections = conn;
	delete items["" + id];
	for(key in items){
		item = items[key];
		if(item.connected.indexOf(id) !== -1){
			item.connected.splice(item.connected.indexOf(id), 1);
		}
	}
}

function newId(x,y){
	return "" + building + "_" + floor + "_" + x.toFixed(0) + "_" + y.toFixed(0) + "_" + getRandomInt(0,1000);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function save(){
	//normalize everything to 1000px
	var _items = {};
	var _connections = [];
	for(key in items){
		_items[key] = clone(items[key]);
		var item = _items[key];
		for(key2 in item){
			if(key2.charAt(0) === "x" && typeof item[key2] === "number"){
				_items[key][key2] = _items[key][key2] * 1000 / Number($("#svg").attr("width"))
			}
			else if(key2.charAt(0) === "y" && typeof item[key2] === "number"){
				_items[key][key2] = _items[key][key2] * 1000 / Number($("#svg").attr("height"))
			}
		}
		/*
		stored =  svg width
		______    _________

		normalized  1000px

		normal = stored * 1000 / svg width
		*/

	}

	for(var i = 0; i < connections.length; i++){
		_connections.push(clone(connections[i]));
		_connections[i]["x"] = _connections[i]["x"] * 1000 / Number($("#svg").attr("width"))
		_connections[i]["y"] = _connections[i]["y"] * 1000 / Number($("#svg").attr("height"))
	}

	$.ajax({
	  type: "POST",
	  url: "/update",
	  data: {
	  	building: building,
	  	floor: floor,
	  	items: _items,
	  	connections: _connections
	  },
	  success: function(data){

	  },
	  error: function(e){

	  }
	});
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
	items[id].name = $("#info #name").val();
	items[id].node = $("#info select").val();
}

function closeSelect(){
	$("#info").css("display","none");
}
