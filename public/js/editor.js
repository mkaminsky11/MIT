var floors = [];
var building = Number($("#buildings").find(":selected").text());
var floor = 0;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var svg = document.getElementById('svg');
var pdf_viewport = null;

var storage = [];
var juncs = [];

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

	getJunctions(function(data){
		juncs = data;
	});
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