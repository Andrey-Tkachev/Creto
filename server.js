global.__approot = __dirname;

var express           = require("express");
var path              = require('path'); // модуль для парсинга пути
var log               = require('./libs/log')(module); // обертка для лога winston
var config            = require('./libs/config'); // обертка для nconf
var favicon           = require('serve-favicon');

// Database libs
var MessageModel      = require('./libs/mongo-db-manager').MessageModel;
var UserModel         = require('./libs/mongo-db-manager').UserModel;
var RoomModel         = require('./libs/mongo-db-manager').RoomModel;
var DrawingEventModel = require('./libs/mongo-db-manager').DrawingEventModel;
var mongoose          = require('./libs/mongo-db-manager').mongoose;
var deepPopulate      = require('./libs/mongo-db-manager').deepPopulate;


// Logic libs
var login             = require('./libs/login');
var registration      = require('./libs/registration');
var profile           = require('./libs/profile');
var statuses          = require('./libs/statuses');
var profile_editor    = require('./libs/profile-editor');
var people            = require('./libs/people');
var rooms             = require('./libs/rooms');

var session           = require('express-session');
var MongoStore        = require('connect-mongodb-session')(session);
var sharedsession     = require("express-socket.io-session");
var sessionStore      = new MongoStore({ mongooseConnection: mongoose });

var bodyParser        = require('body-parser');
var swig              = require('swig');
var xssFilters        = require('xss-filters');
var zlib              = require('zlib');
var cacheTime         = config.get('cache_time');
var cookieTime        = config.get('cookie_time'); 
var app               = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Static files sharing
app.use(favicon(__dirname + '/public/favicon.png'));
app.use('/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/room/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/rooms/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/auth/register/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/auth/login/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/edit/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/people/', express.static(__dirname + '/public/', { maxAge: cacheTime }));

app_session = session({
      secret: 'lakjsdbjuyolqlll',
      cookie: {
        maxAge: cookieTime 
      },
      store: sessionStore,
      resave: true,
      saveUninitialized: true
})

app.use(app_session);
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

load_user = login.load_user;



// Registration
app.get('/auth/register/',  registration.page);
app.post('/auth/register/', registration.create_user);  


// Login
app.get('/auth/login/',    login.page);
app.post('/auth/login/',   login.authorize);
app.delete('/auth/login/', login.logout);

// Status updating
app.put('/status/', load_user, statuses.put_status);
UserModel.update({},  {status : 'offline'}, {multi: true}, function(err){});

// Profile editor
app.get('/edit/',        load_user, profile_editor.page);
app.post('/edit/',       load_user, profile_editor.edit);
app.post('/edit/avatar', load_user, profile_editor.change_avatar);

// Friends
app.get('/people/', load_user, people.page);

app.get('/people/all/',      load_user, people.peoples);
app.get('/people/friends/',  load_user, people.friends);
app.get('/people/requests/', load_user, people.requests);

app.post('/people/request/',        load_user, people.friend_request.request);
app.delete('/people/request/',      load_user, people.delete_from_friends);
app.post('/people/request/accept/', load_user, people.friend_request.accept);
app.post('/people/request/reject/', load_user, people.friend_request.reject);



// Admin funcs. TODO: more functionality 
app.get('/admin/clear/rooms', load_user, function(req, res) {
  RoomModel.remove({}, function (err, room) {
        if (err) return handleError(err);
         res.send('OK');
    });

});

app.get('/admin/clear/messages', load_user, function(req, res) {
  MessageModel.remove({}, function (err) {
        if (err) return handleError(err);
         res.send('OK');
    });

});

app.get('/admin/clear/users', load_user, function(req, res) {
  UserModel.remove({}, function (err) {
        if (err) return handleError(err);
        res.send('OK');
    });

});



var server  = app.listen(config.get('port'), function(){
    log.info('Server listening on port ' + config.get('port'));
});
var io      = require('socket.io').listen(server);

io.use(sharedsession(app_session));





// Room
app.get('/room/:id', load_user, function(req, res, next){
    res.render(__dirname + '/public/html/chat_room.html', 
              { 'user_menu' : true,
                'person' : {
                    'name'           : req.currentUser.full_name,
                    'images'         : req.currentUser.images.url,
                    'thumb'          : req.currentUser.thumb.url,
                    'requests_count' : req.currentUser.friends_requests.length
                  }});
});

// Rooms Page
app.get('/rooms/list', load_user, rooms.user_rooms);
app.get('/rooms/',     load_user, rooms.page);
app.post('/rooms/',    load_user, rooms.create_room);

// User Page
app.get('/',    profile.page);
app.get('/:id', profile.page);




// Soсket chat
var users = {};

io.sockets.on('connection', function(socket){
  // USER CONNECTED
  currentUser = null;
  UserModel.findById(socket.handshake.session.user_id, function(err, user) {
    if (user) {
      users[socket.handshake.session.user_id] = user;
      log.info('User connected to general ' + user.email);
    } else {
      log.info("Socket connection error. User not found.");
    }
  });

  defaultRoom = 'general';
  socket.room = defaultRoom;
  socket.join(defaultRoom);

  // INIT MESSAGE FOR ROOM DEFINING 
  socket.on('join room', function(room_info){
    if (socket.room == defaultRoom){
      user_id = socket.handshake.session.user_id;
      RoomModel.findById(room_info.id)
               .populate({path : "users", 
                          select : "thumb url _id first_name last_name status"})
               .exec(function (err, room){
        
        if (room){
          target = null;
          is_member = false;
          for (var i = 0; i < room.users.length; i++)
              {
                if(room.users[i].id != user_id)
                {
                  target = room.users[i];
                }
                else{
                  is_member = true;
                }
              } 
              
          if(is_member)
          {
            socket.leave(defaultRoom);
            socket.join(room_info.id);
            socket.room = room_info.id;
            log.info("new user in room " + socket.room);
            socket.emit('status', {status  : 'ok', 
                                   user_id : user_id,
                                   target  : target});
          }
        }
                          
      });  
    }
    
  }); 

  // notifications
  socket.on('get notification', function(msg){
      if (socket.room == defaultRoom){
        var session_id = socket.handshake.session.user_id;
        user = users[user.socket.handshake.session.user_id];
        socket.emit('notification', user.notifications());
        
      }
    });

  // NEW MESSAGE
  socket.on('message', function(msg){
    if (socket.room != defaultRoom){
      var user_ref = null, 
          author   = "";
      if (users[socket.handshake.session.user_id]) {
          user_ref = users[socket.handshake.session.user_id];
          author = user_ref.full_name;
          log.info('messge from ' + user_ref.email);

          var message = new MessageModel({
              user_ref    : user_ref,
              message_text: xssFilters.inHTMLData(msg),
              room_ref    : socket.room
          });
          message.save();
          RoomModel.update({ _id: socket.room }, {$set: {last_message : message}}, { upsert: true }, function(){});
          
          zlib.gzip(JSON.stringify(message), function(err, buffer) {
            io.sockets.to(socket.room).emit('message', buffer.toString('base64'));
            if(err) {
              log.error(err.message);
            }
          });
      } 
      else {
          log.info("user not found");
      }
    	
    }
  });

  // CLEAR 
  socket.on('clear', function(){
    if (socket.room != defaultRoom){
      socket.broadcast.to(socket.room).emit('clear', '');
      
      DrawingEventModel.remove({}, function (err) {
          if (err) return handleError(err);
      });
    }
  });

  // NEW DRAW
  socket.on('drawing', function(drw){
    if (socket.room != defaultRoom){
      var drawing = new DrawingEventModel({
          author    : socket.handshake.session.user_id,
          drawing   : drw,
          room_ref  : socket.room
      });

      drawing.save();
      socket.broadcast.to(socket.room).emit('drawing', drw);
    }
  });
  
  // LAST MESSAGES
  socket.on('last messages', function(msg){
    if (socket.room != defaultRoom){
      log.info('Messages history request ' + users[socket.handshake.session.user_id].email);
      MessageModel.find({room_ref : socket.room})
                  .sort({'date': 'asc'})
                  .populate({path: 'user_ref', select: 'thumb first_name last_name status'})
                  .exec(function (err, msgs){
                      send_gzip_json(msgs, 'last messages', socket)
                  });
    }
  });

  function send_gzip_json(data, even){
    if (socket.room != defaultRoom){
      zlib.gzip(JSON.stringify(data), function(err, buffer) {
                //console.log(drw);
                socket.emit(even, buffer.toString('base64'));
                if(err) {
                  log.error(err.message);
                }
            });
    }
  }

  // LAST DRAWING
  socket.on('last drawing', function(msg){
    if (socket.room != defaultRoom){
      log.info('Drawing history request ' + users[socket.handshake.session.user_id].email)
      DrawingEventModel.find({room_ref : socket.room}, function (err, drws) {
        var max_block_size = 5000;
        blocks_num = Math.floor(drws.length / max_block_size);
        for (var i = blocks_num - 1; i >= 0; i--)
        {
          block = drws.slice(i * max_block_size, (i + 1) * max_block_size);
          send_gzip_json(block, 'last drawing', socket);  
        }
        send_gzip_json(drws.slice(blocks_num * max_block_size, drws.length), 'last drawing', socket);  
      
      }); 
    }
  }); 
});

