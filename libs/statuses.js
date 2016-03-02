var UserModel = require('./mongo-db-manager').UserModel;


function update_status(user, new_status){
	
	if (new_status == 'online'){
		UserModel.update({_id : user.id}, {$set : {status : new_status, last_visit: Date()}}, {upsert:true}, function(err){});
	}
	else{
		UserModel.update({_id : user.id}, {$set : {status : new_status}}, {}, function(err){});
	}

	
}

function put_status(req, res){
	// Set offline after 10 minutes
	var now = new Date();
	delta = now - Date.parse(req.currentUser.last_visit);
	wait_time = 60 * 10 * 1000;
	if (delta >= wait_time){
		setTimeout(update_status, wait_time, req.currentUser, 'offline');
	}
	
	update_status(req.currentUser, 'online');
	res.end(JSON.stringify({status : 200})); 
}



module.exports.put_status      = put_status;
//module.exports.get_status      = get_status;
