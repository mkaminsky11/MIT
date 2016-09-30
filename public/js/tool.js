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
	$("#junction-only").css("display","none")
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
		if(tool.node.type === "stairs" || tool.node.type === "elevator" || tool.node.type === "switch"){
			newJunction(counter, building + "-" + floor + " " + tool.node.type,tool.node.type, function(data){
				if(!data.err){
					juncs.push(data.junction);
				}
			});
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