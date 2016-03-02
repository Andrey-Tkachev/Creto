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
          'id'         : person.id,
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
  .populate({path: 'users last_message', 
             select: 'thumb first_name last_name message_text user_ref last_visit status'})
  .exec(function(err, rooms) {
      rooms_info = [];
      for (var i = 0; i < rooms.length; i++)
      {
        var members_count = rooms[i].users.length;
        var last_message  = rooms[i].last_message;
        

        if (last_message){
          extra_message = {message_text : last_message.message_text};
          for (var j=0; j < rooms[i].users.length; j++)
          {
            if (rooms[i].users[j].id == last_message.user_ref)
            {
              extra_message['thumb']  = rooms[i].users[j].thumb;
              extra_message['author'] = rooms[i].users[j].first_name;
            }
          }
          last_message = extra_message;
        }

        status = { last_visit : null, 
                   status : null};

        if (rooms[i].dialog)
        {
          target = rooms[i].users[0];
          if (rooms[i].users[0].id == req.currentUser.id){
            target = rooms[i].users[1];
          }
          status = { last_visit : target.last_visit, status : target.status};

          targ_thumb = target.thumb;
          full_name = target.first_name + ' ' + target.last_name;          
        }
        else{
          
          full_name = 'Multy';
          targ_thumb = ''; // TODO Multy dialog thumb
        }

        rooms_info.push({members_count : members_count, 
                         last_message  : last_message, 
                         room          : rooms[i], 
                         thumb         : targ_thumb, 
                         full_name     : full_name,
                         status        : status });
      }
      res.end(JSON.stringify({status : 200, rooms : rooms_info})); 
  });
  
}

function create_room(req, res){
  log.info('creating new room');
  
  var rooms =  req.currentUser.rooms;
  members_id_list = req.body.members;

  log.info('members count ' + members_id_list.length);
  is_dialog = (members_id_list.length == 1) && (req.body.is_dialog);

  
  UserModel.find({_id : {$in : members_id_list}}, function(err, users) {
    if (is_dialog){
      RoomModel.find({users : req.currentUser, dialog : true}, function(err, room) {
              duplicate = false;
              for (var i=0; i<room.length; i++)
                {
                  if (room[i].users.indexOf(members_id_list[0]) != -1){
                    duplicate = true;
                    res.end(JSON.stringify({status : 200, redirect : room[i].id })); 
                  }

                }
              if (!duplicate)
              {
                users.push(req.currentUser);      
                var Room = new RoomModel({creator : req.currentUser, 
                                          dialog  : req.body.is_dialog, 
                                          users   : users});
                Room.save();
                res.end(JSON.stringify({status : 200, redirect : Room.id })); 
              }
      });
    }
    else{
        users.push(req.currentUser);      
        var Room = new RoomModel({creator : req.currentUser, dialog : req.body.is_dialog, users:users});
        Room.save();
        res.end(JSON.stringify({status : 200, redirect : Room.id })); 
    }
  });

}

module.exports.page         = page;
module.exports.create_room  = create_room;
module.exports.user_rooms   = user_rooms;