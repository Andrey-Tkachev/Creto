var UserModel         = require('./mongo-db-manager').UserModel;
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
  req.currentUser.friends.remove(req.currentUser);
  req.currentUser.save();
    UserModel.findById(req.session.user_id, function(err, user) {
      if (user) {
        friends = [];
        
        res.render('../public/html/people.html', 
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
    });
}

function peoples(req, res) {
  //UserModel.findOne({ _id:null}).remove().exec();
  UserModel.find({})
                .sort({'first_name': 'asc'})
                .exec(function (err, users){
                    safe_users = [];
                    for (var i=0; i<users.length; i++){
                     
                     if ((req.currentUser.friends_requests.indexOf(users[i]._id) == -1) && (req.currentUser.friends.indexOf(users[i]._id) === -1) && (users[i].id !== req.currentUser.id))
                     {
                        safe_users.push(safe_person(users[i]));
                      }
                    }
                    res.end(JSON.stringify({status : 200, peoples : JSON.stringify(safe_users)}));
                });  
}

function friends(req, res) {
  UserModel.findById(req.session.user_id)
  .populate({path: 'friends', select: 'thumb first_name last_name full_name about'})
  .exec(function(err, user) {
      if (user) {
        friends_list = [];
        for (var i=0; i<user.friends.length; i++){
          friends_list.push(safe_person(user.friends[i]));
        }
        res.end(JSON.stringify({status : 200, peoples : JSON.stringify(friends_list)}));
      }
  });
}

function requests(req, res) {
  UserModel.findById(req.session.user_id).populate({path: 'friends_requests', select: 'thumb first_name last_name full_name'}).exec(function(err, user) {
      if (user) {
        requests = [];
        for (var i=0; i<user.friends_requests.length; i++){
          requests.push(safe_person(user.friends_requests[i]));
        }
        res.end(JSON.stringify({status : 200, peoples : JSON.stringify(requests)}));
      }
  });
}

friend_request = { 
  request : function (req, res) {
    log.info('Friend request');
    UserModel.findById(req.body.id)
             .exec(function(err, target_user) {
                if ((target_user) && (target_user.friends_requests.indexOf(req.currentUser._id) == -1)) {
                  UserModel.update({ _id: req.body.id }, 
                                   { $pushAll: { friends_requests : [req.currentUser] }}, 
                                   { upsert:true }, 

                                    function(err) { 
                                      if (err) {
                                        res.send(JSON.stringify({message : 'Update error', status: 500}));
                                      }
                                      else {
                                        res.send(JSON.stringify({status : 200}));
                                      } 
                                    }
                                  );
                  }
                else {
                  res.send(JSON.stringify({message : 'duplication request', status: 500}));
                }
            });


  },

  accept  : function (req, res) {
    log.info('Friend accept');
    if (req.currentUser.friends.indexOf(req.body.id) == -1){

      UserModel.findById(req.body.id, function(err, target_user) {   
          if (target_user){ 
            target_user.friends_requests.remove(req.currentUser); target_user.save();
            req.currentUser.friends_requests.remove(target_user); req.currentUser.save();

            UserModel.update({ _id: req.body.id }, {$pushAll: {friends : [req.currentUser]}}, {upsert:true}, function(err) {
                if (err){
                 res.sendStatus(500);
                }
            });
            UserModel.update({ _id: req.currentUser.id }, {$pushAll: {friends : [target_user]}}, {upsert:true}, function(err) { 
              if (err){
                res.sendStatus(500);
              }
              else{
                res.end(JSON.stringify({status : 200}));
              }
            });
          }
          else{
            res.sendStatus(500);
          }
      });
  }
  else {
    res.sendStatus(500);
  }

  },
  reject  : function (req, res) {
    log.info('Friend reject');
    UserModel.findById(req.body.id).exec( function (err, target_user) {
        if (err) {
          res.send(JSON.stringify({status : 500}));
        }
        else { 
          req.currentUser.friends_requests.remove(target_user);
          req.currentUser.save();
          res.send(JSON.stringify({status : 200}));
        }
    });
  } 
}

function delete_from_friends(req, res) {
  log.info('Delete from friend');
  UserModel.findById(req.body.id).exec( function (err, target_user) {
      if (err) {
        res.send(JSON.stringify({status : 500}));
      }
      else { 
        target_user.friends.remove(req.currentUser);
        target_user.save();
        req.currentUser.friends.remove(target_user);
        req.currentUser.save();
        res.send(JSON.stringify({status : 200}));
      }
  });
}

module.exports.peoples            = peoples;
module.exports.friends            = friends;
module.exports.requests           = requests;

module.exports.page               = page;
module.exports.friend_request     = friend_request;
module.exports.delete_from_friends = delete_from_friends;