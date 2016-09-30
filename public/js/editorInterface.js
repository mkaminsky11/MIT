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
	if(type === "stairs" || type === "elevator" || type === "switch"){
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
					configureSelect(storage[i]);
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
	for(var i = 0; i < storage.length; i++){
		if(storage[i].id === id && storage[i].type === "node"){
			if(storage[i].data.node === "stairs" || storage[i].data.node === "elevator" || storage[i].data.node === "switch"){
				var val = $("#junction-select").val();
				if(val === ""){
					removeJunctionItem(id,function(data){
					});
				}
				else{
					updateJunction(id,val,function(data){
					});
				}
			}
		}
	}
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

function configureSelect(item){
	$("#info #type").val(item.data.node);
	$("#info #name").val(item.data.name);
	if(item.data.node === "elevator" || item.data.node === "stairs" || item.data.node === "switch"){
		$("#junction-only").css("display","block");
		/*
		CONFIGURE THE JUNCTION
		*/
		$("#junction-select").html("<option value='' selected>Not connected</option>");
		for(var i = 0; i < juncs.length; i++){
			var selected = "";
			if(juncs[i].points.indexOf(item.id) !== -1){
				selected = "selected"
			}
			$("#junction-select").append("<option value='" + juncs[i].id + "' "+selected+">" + juncs[i].name + "</option>")
			if(juncs[i].points.indexOf(item.id) !== -1){
				$("#junction-select").val(juncs[i].id);
			}
		}
	}
	else{
		$("#junction-only").css("display","none");
	}
}