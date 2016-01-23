var log          = require('./log')(module);
var UserModel    = require('./mongo-db-manager').UserModel;


function page(req, res, next) {
    res.render('../public/html/registration_form.html', {});
}

function create_user(req, res, next) {
    UserModel.findOne({email : req.body.email}, 
      function(err, user) {
        if (user){
          res.sendStatus(400);
        }
        else{
          var user = new UserModel(req.body);
          console.log(user);
          user.images = {url : 'images/user.png'};
          user.save(); 
          var response = {
                status  : 200,
                success : 'Register Successfully',
                redirect : '/auth/login/'
            }
          res.end(JSON.stringify(response));
        }
      });
}

module.exports.create_user = create_user;
module.exports.page        = page;
