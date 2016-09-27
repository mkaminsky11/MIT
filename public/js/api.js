function newLine(x1,y1,x2,y2,id){
	$.ajax({
	  type: "POST",
	  url: "/new",
	  data: {
	  	building: building,
	  	floor: floor,
	  	type: "line",
	  	id: id,
	  	data: normalize({
		  	x1: x1,
		  	y1: y1,
		  	x2: x2,
		  	y2: y2
		})
	  },
	  success: function(data){

	  },
	  error: function(e){

	  }
	});
}

function newNode(x,y,id,name,type){
	$.ajax({
	  type: "POST",
	  url: "/new",
	  data: {
	  	building: building,
	  	floor: floor,
	  	type: "node",
	  	id: id,
	  	data: normalize({
	  		x: x,
	  		y: y,
	  		node: type,
	  		name: name
	  	})
	  },
	  success: function(data){

	  },
	  error: function(e){

	  }
	});
}

function deleteObject(id){
	//delete from array
	var foundIndex = -1;
	for(var i = 0; i < storage.length; i++){
		if(storage[i].id === id){
			foundIndex = i;
		}
	}
	if(foundIndex !== -1){
		storage.splice(foundIndex,1);
	}
	//
	$.ajax({
	  type: "POST",
	  url: "/delete",
	  data: {
	  	building: building,
	  	floor: floor,
	  	id: id
	  },
	  success: function(data){

	  },
	  error: function(e){

	  }
	});
}

function updateNode(id, name, node){
	console.log(name,node);
	$.ajax({
	  type: "POST",
	  url: "/update",
	  data: {
	  	building: building,
	  	floor: floor,
	  	id: id,
	  	data: {
		  	name: name,
		  	node: node
		}
	  },
	  success: function(data){

	  },
	  error: function(e){

	  }
	});
}