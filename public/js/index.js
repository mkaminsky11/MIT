var floors = [];
var building = Number($("#buildings").find(":selected").text());
var floor = 0;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var svg = document.getElementById('svg');

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
	svg.height = canvas.height / 3;
	svg.width = canvas.width / 3;

	svg.addEventListener('click', function (event) {
		tool.do(event.offsetX, event.offsetY);
	}, false);
	
	svg.addEventListener('mousemove', function (event) {
		tool.hover(event.offsetX, event.offsetY);
	}, false);	

	loadFloor();
});



function loadFloor(){
	building = Number($("#buildings").find(":selected").text());
	floor = Number($("#floors").find(":selected").text());
	var url = "/plans/" + building + "_" + floor + ".pdf";
	PDFJS.getDocument(url).then(function(pdf) {
		pdf.getPage(1).then(function(page) {
			context.clearRect(0, 0, canvas.width, canvas.height);
			$("#data").html("");
			var viewport = page.getViewport(1);
			var scale = canvas.width / viewport.width;
			var scaledViewport = page.getViewport(scale);

			var renderContext = {
			  canvasContext: context,
			  viewport: scaledViewport
			};
			page.render(renderContext);
		});
	});
}


var nodes = [];
var lines = [];
var elevators = [];
var stairs = [];

/*
select
node
line
elevator
stairs
eraser
*/


var tool = {}
tool.tool = "select"
tool.node = {}
tool.select = {}
tool.line = {
	start: null
}
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
	tool.tool = "line";
}
tool.reset = function(){
	$(".node-hover").css("display","none");
	$(".line-hover").css("display","none");
	$("#info").css("display","none");
	tool.line.first = null;
}
tool.do = function(x,y){
	if(tool.tool === "node"){
		d3.select("#data").append("circle").attr("cx", x).attr("class","node").attr("data-type","room").attr("cy", y).attr("r", 5).style("fill", "green");
		var last_one = $("#svg circle.node").last().get(0);
		last_one.addEventListener('click', function (event) {
			if(tool.tool === "select"){
				$("#info").css("display","flex");
				$("#info").css("left", event.offsetX);
				$("#info").css("top", event.offsetY + 20);
				$("#info select").val($(this).attr("data-type"));
			}
		}, false);
	}
	else if(tool.tool === "line"){
		if(tool.line.first === null){
			tool.line.first = {x:x, y:y};
			$(".line-hover").css("display","block");
			d3.select(".line-hover").attr("x1", x).attr("y1", y);
		}
		else{
			//actually make the line
			d3.select("#data").append("line").attr("x2", x).attr("class","line").attr("y2", y).attr("x1",tool.line.first.x).attr("y1",tool.line.first.y).attr("stroke-width",3).attr("stroke","green");
			tool.line.first = null;
			$(".line-hover").css("display","none");
		}
	}
};
tool.hover = function(x,y){
	d3.select(".node-hover").attr("cx", x).attr("cy", y);
	d3.select(".line-hover").attr("x2", x).attr("y2", y);
}
/*

line:
if no start (1st point), show hover point
	if on line/node, note that
		if node, snap to it
if there is start, show hypothetical line
	if on line/node, note that
		if node, snap to it

*/