var floors = {
	"62_0": {},
	"62_2": {}
};
for(key in floors){
	$("#pdf-cont").append("<div><svg id='svg-"+key+"'></svg><canvas id='canvas-" + key + "'></canvas></div>");
}
for(key in floors){
	floors[key].canvas = document.getElementById("canvas-" + key);
	floors[key].svg = document.getElementById("svg-" + key);
	floors[key].context = floors[key].canvas.getContext('2d');
	loadFloorPlan(key);
}

function loadFloorPlan(key){
	var url = "/plans/" + key + ".pdf";
	var canvas = floors[key].canvas;
	var context = floors[key].context;
	var svg = floors[key].svg
	PDFJS.getDocument(url).then(function(pdf) {
		pdf.getPage(1).then(function(page) {

			canvas.height = $(canvas).height() * 3
			canvas.width = $(canvas).width() * 3

			context.clearRect(0, 0, canvas.width, canvas.height);
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

			/*
			height / width
			*/

			var renderContext = {
			  canvasContext: context,
			  viewport: scaledViewport
			};

			page.render(renderContext);
		});
	});
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

function search(){
	var info = getRoomInfo($("#room1").val(), $("#room2").val());
	$.ajax({
	  type: "POST",
	  url: "/path",
	  data: {
	  	info: info
	  },
	  success: function(data){
	  	console.log(data);
	  	if(!data.err){
	  		for(var i = 0; i < data.path.length; i++){
	  			var floorId = data.path[i].id.split("_").slice(0,2).join("_");
	  			var svg = floors[floorId].svg;
	  			if(data.path[i].type === "line"){
	  				createNode(data.path[i].x1, data.path[i].y1, "red", svg);
	  				createNode(data.path[i].x2, data.path[i].y2, "red", svg);
	  				createLine(data.path[i].x1, data.path[i].y1, data.path[i].x2, data.path[i].y2, "red", svg);
	  			}
	  			else if(data.path[i].type === "none"){
	  				createNode(data.path[i].x, data.path[i].y, "red", svg);
	  			}
	  		}
	  	}
	  },
	  error: function(e){

	  }
	});
}

function createNode(x,y,color,svg){
	x = x * Number($(svg).attr("width")) / 1000;
	y = y * Number($(svg).attr("height")) / 1000;
	d3.select(svg).append("circle").attr("cx", x).attr("cy", y).attr("r", 5).style("fill", color);
}

function createLine(x1,y1,x2,y2,color,svg){
	x1 = x1 * Number($(svg).attr("width")) / 1000;
	y1 = y1 * Number($(svg).attr("height")) / 1000;
	x2 = x2 * Number($(svg).attr("width")) / 1000;
	y2 = y2 * Number($(svg).attr("height")) / 1000;
	d3.select(svg).append("line").attr("x2", x2).attr("y2", y2).attr("x1",x1).attr("y1",y1).attr("stroke-width",3).attr("stroke",color);
}