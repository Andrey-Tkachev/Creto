var mongoose     = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);
var log          = require('./log')(module);
var config       = require('./config');
var crypto       = require('crypto');
var xssFilters   = require('xss-filters');

mongoose.connect(config.get('mongoose:uri'));
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;


// Schemas
var Images = new Schema({
    url: { type: String, default: 'images/user.png' }
});

var Drawing = new Schema({
	start_x : { type: Number, required: true },
	start_y : { type: Number, required: true },
	end_x : { type: Number, required: true },
	end_y : { type: Number, required: true },
	color : { type: String, required: true },
	line_join : { type: String, required: true },
	width : { type: Number, required: true }
});

var DrawingEvent = new Schema({
	author: { type: String, required: true },
	drawing: [Drawing],
    date: { type: Date, default: Date.now }
	//, _roomId: Schema.Types.ObjectId,
});



var User = new Schema({
    first_name       : { type: String },
    last_name        : { type: String, default: ""},
    email            : { type: String, index: true, unique: true},
    hashed_password  : String,
    
    friends          : [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    friends_requests : [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    images           : { type : Images},
    thumb            : { type : Images, default: {url : 'images/user.png'}},
    birthdate        : { type: String, default: "Not specified"},
    homecity         : { type: String, default: "Not specified"},
    status           : { type: String, default: "None"},
    about            : { type: String, default: "Not specified"},
    salt             : String
  });


User.virtual('safe_email').get(function() {
  return xssFilters(this.email);
});

User.virtual('full_name').get(function() {
  return this.first_name + ' ' + this.last_name;
});

User.virtual('id').get(function() {
  return this._id.toHexString();
});

User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

User.methods.authenticate = function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
};

User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
});

User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

User.pre('save', function(next) {
    if (false) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
});



var Message = new Schema({
    user_ref: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    message_text: { type: String, required: true },
    date: { type: Date, default: Date.now },
    //, _roomId: Schema.Types.ObjectId,
});
  

Message.plugin(deepPopulate, {} /* more on options below */);

/*
var Room = new Schema({
    members: [User],
    date: { type: Date, default: Date.now }
});
*/
function mongoStoreConnectionArgs() {
  return { dbname: db.db.databaseName,
           host: db.db.serverConfig.host,
           port: db.db.serverConfig.port};
};


var UserModel = mongoose.model('User', User);
var MessageModel = mongoose.model('Message', Message);
var DrawingEventModel = mongoose.model('DrawingEvent', DrawingEvent);
var UserModel = mongoose.model('User', User);

module.exports.MessageModel = MessageModel;
module.exports.DrawingEventModel = DrawingEventModel;
module.exports.UserModel = UserModel;
module.exports.mongoose = db;
module.exports.deepPopulate = deepPopulate;