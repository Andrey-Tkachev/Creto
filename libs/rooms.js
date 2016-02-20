var UserModel         = require('./mongo-db-manager').UserModel;
var RoomModel         = require('./mongo-db-manager').RoomModel;
var MessageModel      = require('./mongo-db-manager').MessageModel;
var xssFilters        = require('xss-filters');
var url               = require("url");
var log               = require('./log')(module);

function safe_person(person){
  return {'full_name'  : person.full_name,
          'first_name' : person.first_name,
          'last_name'  : person.last_name,
          'about'      : person.about, 
          'thumb'      : person.thumb.url,
          'id'         : person._id,
          'birthdate'  : person.birthdate}
}

function page(req, res){
  user = req.currentUser;
  res.render('../public/html/rooms.html', 
                                        {'self': true,
                                            'person' :  {
                                              'first_name'     : user.first_name,
                                              'last_name'      : user.last_name,
                                              'images'         : user.thumb.url,
                                              'name'           : user.full_name,
                                              'thumb'          : user.thumb.url,
                                              'requests_count' : user.friends_requests.length
                                            }
                                        });
}

function user_rooms(req, res){
  var last_message = null;
  RoomModel.find({users : req.currentUser})
  .populate({path: 'users', select: 'thumb first_name last_name'})
  .exec(function(err, rooms) {
      //console.log(rooms);
      rooms_info = [];
      for (var i = 0; i < rooms.length; i++)
      {
        var members_count = rooms[i].users.length;

        MessageModel.findOne({ room_ref : rooms[i]}, function(err, msg){
                        last_message = msg;
                    });  
        console.log(last_message);
        if (rooms[i].dialog)
        {
          target = rooms[i].users[0];
          console.log(rooms[i].users[0].first_name)
          if (rooms[i].users[0].id == req.currentUser.id){
            target = rooms[i].users[1];
          }
          targ_thumb = target.thumb;
          full_name = target.first_name + ' ' + target.last_name;
          
          
        }
        else{
          full_name = 'Multy';
          targ_thumb = last_message.user_ref.thumb;
        }
        rooms_info.push({members_count : members_count, last_message : last_message, room : rooms[i], thumb : targ_thumb, full_name : full_name});
      }
      res.end(JSON.stringify({status : 200, rooms : rooms_info})); 
  });
  
}

function create_room(req, res){
  log.info('creating new room');
  
  var rooms =  req.currentUser.rooms;
  members_id_list = req.body.members;

  log.info('members count ' + members_id_list.length);
  
  
  var ok = true;
  UserModel.find({_id : {$in : members_id_list}}, function(err, users) {
    ok = true;
    if (req.body.is_dialog){
      RoomModel.find({users : req.currentUser, users : users[0], dialog : true}, function(err, room) {
              if (room && (room.length != 0)){
                console.log(room.length);
                res.end(JSON.stringify({status : 200, redirect : room[0].id })); 
              }
              else
              {
                users.push(req.currentUser);      
                var Room = new RoomModel({creator : req.currentUser, dialog : req.body.is_dialog, users:users});
                Room.save();
                res.end(JSON.stringify({status : 200, redirect : Room.id })); 
              }
      });
    }
    else{
      if (ok) {
        users.push(req.currentUser);      
        var Room = new RoomModel({creator : req.currentUser, dialog : req.body.is_dialog, users:users});
        Room.save();
        res.end(JSON.stringify({status : 200, redirect : Room.id })); 
      }
    }
  });

}

module.exports.page         = page;
module.exports.create_room  = create_room;
module.exports.user_rooms   = user_rooms;