function getJunctions(callback){
	$.ajax({
	  type: "GET",
	  url: "/junctions/all",
	  data: {
	  },
	  success: function(data){
	  	callback(data);
	  },
	  error: function(e){

	  }
	});
}

function newJunction(id, name, type, callback){
	$.ajax({
	  type: "POST",
	  url: "/junctions/new",
	  data: {
	  	points: [id],
	  	name: name
	  },
	  success: function(data){
	  	callback(data);
	  },
	  error: function(e){

	  }
	});
}

function updateJunction(itemId, newJunctionId, callback){ // if something is selected
	$.ajax({
		type: "POST",
		url: "/junctions/update",
		data: {
			id: itemId,
			junc: newJunctionId
		},
		success: function(data){
		  callback(data);
		},
		error: function(e){

		}
	});
}

function removeJunctionItem(itemId, callback){ // if Not Connected is selected
	$.ajax({
		type: "POST",
		url: "/junctions/delete",
		data: {
			id: itemId
		},
		success: function(data){
		  callback(data);
		},
		error: function(e){

		}
	});
}