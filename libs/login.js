var log          = require('./log')(module);
var UserModel    = require('./mongo-db-manager').UserModel;

function logout(req, res, next) {
  log.info('logout request');
   if (req.session.user_id) {
    req.session.destroy(function() {});
  }
  else{
    res.end(JSON.stringify({status:400}));
  }
  
}


function authorize(req, res, next) {
  	log.info('authorize request');
	UserModel.findOne({email : req.body.email}, function(err, user) {
	      if (user){
	        if (user.authenticate(req.body.password)){
	          req.session.user_id = user.id;
	          var response = {
	              status  : 200,
	              success : 'Updated Successfully',
	              redirect : '/'
	          }
	          log.info('user ' + user.email + ' online');
	          res.end(JSON.stringify(response));
	        }
	        else{
	          res.sendStatus(400);
	          log.info('auth error (bad password) ' + user.email);
	        }
	      }
	      else{
	          res.sendStatus(400);
	          log.info('auth error (user dosnt exist)');
	        }
	    }
	);
}

function page(req, res, next) {
    res.render('../public/html/login_form.html', {});
}

function load_user(req, res, next) {
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


module.exports.load_user = load_user;
module.exports.authorize = authorize;
module.exports.logout    = logout;
module.exports.page      = page;