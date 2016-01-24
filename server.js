global.__approot = __dirname;

var express           = require("express");
var path              = require('path'); // модуль для парсинга пути
var log               = require('./libs/log')(module); // обертка для лога winston
var config            = require('./libs/config'); // обертка для nconf


// Database libs
var MessageModel      = require('./libs/mongo-db-manager').MessageModel;
var UserModel         = require('./libs/mongo-db-manager').UserModel;
var DrawingEventModel = require('./libs/mongo-db-manager').DrawingEventModel;
var mongoose          = require('./libs/mongo-db-manager').mongoose;
var deepPopulate      = require('./libs/mongo-db-manager').deepPopulate;


// Logic libs
var login             = require('./libs/login');
var registration      = require('./libs/registration');
var profile           = require('./libs/profile');
var profile_editor    = require('./libs/profile_editor');
var people           = require('./libs/people');

var session           = require('express-session');
var MongoStore        = require('connect-mongodb-session')(session);
var sharedsession     = require("express-socket.io-session");
var sessionStore      = new MongoStore({ mongooseConnection: mongoose });

var bodyParser        = require('body-parser');
var app               = express();
var swig              = require('swig');
var xssFilters        = require('xss-filters');
var zlib              = require('zlib');
var cacheTime         = config.get('cache_time');
var cookieTime        = config.get('cookie_time')  
app.use(bodyParser.urlencoded({ extended: true }));

// Static files sharing
app.use('/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/room/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/auth/register/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/auth/login/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/edit/', express.static(__dirname + '/public/', { maxAge: cacheTime }));
app.use('/people/', express.static(__dirname + '/public/', { maxAge: cacheTime }));

app.use(session({
      secret: 'lakjsdbjuyolqlll',
      cookie: {
        maxAge: cookieTime // 1 week 
      },
      store: sessionStore
}));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

// SingIn and SingUp 
function loadUser(req, res, next) {
  if (req.session.user_id) {
    UserModel.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/auth/login/');
      }
    });
  } else {
    res.redirect('/auth/login/');
  }
}

app.get('/auth/register/',  registration.page);
app.post('/auth/register/', registration.create_user); 

app.get('/auth/login/',  login.page);
app.post('/auth/login/', login.authorize);
app.delete('/auth/login/',  login.logout);


// Profile editor
app.get('/edit/', loadUser, profile_editor.page);
app.post('/edit/', loadUser, profile_editor.edit);
app.post('/edit/avatar', loadUser, profile_editor.change_avatar);

// Friends
app.get('/people/', loadUser, people.page);

app.get('/people/all/', loadUser, people.peoples);
app.get('/people/friends/', loadUser, people.friends);
app.get('/people/requests/', loadUser, people.requests);

app.post('/people/request/', loadUser, people.friend_request.request);
app.delete('/people/request/', loadUser, people.delete_from_friends);
app.post('/people/request/accept/', loadUser, people.friend_request.accept);
app.post('/people/request/reject/', loadUser, people.friend_request.reject);

// Messages
app.get('/room/', loadUser, function(req, res, next){
    res.render(__dirname + '/public/html/chat_room.html', 
              { 'user_menu' : true,
                'person' : {
                    'name'           : req.currentUser.full_name,
                    'images'         : req.currentUser.images.url,
                    'thumb'          : req.currentUser.thumb.url,
                    'requests_count' : req.currentUser.friends_requests.length
                  }});
});


// Admin funcs. TODO: more functionality 
app.get('/admin/clear/messages', loadUser, function(req, res) {
  MessageModel.remove({}, function (err) {
        if (err) return handleError(err);
         res.send('OK');
    });

});

app.get('/admin/clear/messages', loadUser, function(req, res) {
  UserModel.remove({}, function (err) {
        if (err) return handleError(err);
        res.send('OK');
    });

});

// User Page
app.get('/', profile.page);
app.get('/:id', profile.page);

var server  = app.listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});
var io      = require('socket.io').listen(server);


// Websoket chat
var users = {};
io.sockets.on('connection', function(socket){
  // USER CONNECTED
  UserModel.findById(socket.handshake.session.user_id, function(err, user) {
    if (user) {
      users[socket.handshake.session.user_id] = user;
      log.info('new user in room ' + user.email);
    } else {
      log.info("room access error");
    }
  });

  // NEW MESSAGE
  socket.on('message', function(msg){
    var user_ref = null, 
        author   = "";
    if (users[socket.handshake.session.user_id]) {
        user_ref = users[socket.handshake.session.user_id];
        author = user_ref.full_name;
        log.info('messge from ' + user_ref.email);
    } 
    else {
        log.info("user not found");
    }
  	var message = new MessageModel({
        user_ref    : user_ref,
        message_text: xssFilters.inHTMLData(msg),
    });
    message.save();
    zlib.gzip(JSON.stringify(message), function(err, buffer) {
      io.sockets.emit('message', buffer.toString('base64'));
      if(err) {
        log.error(err.message);
      }
    });
  });

  // CLEAR 
  socket.on('clear', function(){
    socket.broadcast.emit('clear', '');
    
    DrawingEventModel.remove({}, function (err) {
        if (err) return handleError(err);
    });

  });

  // NEW DRAW
  socket.on('drawing', function(drw){
    var drawing = new DrawingEventModel({
        author: socket.handshake.session.user_id,
        drawing: drw
    });

    drawing.save();
    socket.broadcast.emit('drawing', drw);
  });
  
  // LAST MESSAGES
  socket.on('last messages', function(msg){
    log.info('request last messages ' + users[socket.handshake.session.user_id].email);
    MessageModel.find({})
                .sort({'date': 'asc'})
                .populate({path: 'user_ref', select: 'thumb first_name last_name'})
                .exec(function (err, msg){
                        zlib.gzip(JSON.stringify(msg), function(err, buffer) {
                            socket.emit('last messages', buffer.toString('base64'));
                            if(err) {
                              log.error(err.message);
                            }
                          });
                });  
  });

  function send_gzip_json(data, even){
    zlib.gzip(JSON.stringify(data), function(err, buffer) {
              //console.log(drw);
              socket.emit(even, buffer.toString('base64'));
              if(err) {
                log.error(err.message);
              }
          });
  }

  // LAST DRAWING
  socket.on('last drawing', function(msg){
    log.info('request last drawing ' + users[socket.handshake.session.user_id].email)
    DrawingEventModel.find({}, function (err, drw) {
      var step = 1;
      var offset = 0;
      var chunck_size = 100; 
      if (drw.length > 2000){
        step = 2;
      }
      to_send = [];
      to_send_after = [];
      for (var i=0; i<drw.length; i += step){
        to_send.push(drw[i]);
        if (drw.length > 5000)
          to_send_after.push(drw[i + 2 * step - 1]);
        else
          to_send_after.push(drw[i + 1]);
        if (to_send.length == chunck_size) {
          send_gzip_json(to_send, 'last drawing');
          to_send = [];
        }
      }
      if (to_send_after.length > 5000)
      {
        offset = 1000;
      }
      send_gzip_json(to_send_after.slice(offset, 5000 + offset), 'last drawing');
    });  
  }); 
});

io.use(sharedsession(session({
      secret: 'lakjsdbjuyolqlll',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week 
      },
      store: sessionStore
}), {
    autoSave:true
}));
