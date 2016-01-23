var UserModel         = require('./mongo-db-manager').UserModel;
var xssFilters        = require('xss-filters');
var url               = require("url");

function page(req, res, next) {
  user_id = req.session.user_id;
  if (url.parse(req.url).path == '/'){
    if (user_id){
      res.redirect('/' + user_id);
    }
    else{
      res.redirect('/auth/login');
    }
  }
  else{
    target = url.parse(req.url).path.substring(1);
    UserModel.findById(target, function(err, target_user) {
       UserModel.findById(user_id, function(err, user) {
        if(user){
          if (target_user) {
            res.render('../public/html/user_page.html', 
                                    {'self': (target == user_id),
                                     'notself': (target != user_id) && (user),
                                     'person': {
                                          'name'        : user.full_name,
                                          'images'      : user.images.url,
                                          'thumb'       : user.thumb.url
                                     },
                                      'tperson' :  {
                                          'name'        : target_user.full_name,
                                          'images'      : target_user.thumb.url,
                                          'about'       : target_user.about,
                                          'friends'     : target_user.friends,
                                          'birthdate'   : target_user.birthdate,
                                          'homecity'    : target_user.homecity,
                                          'status'      : target_user.status,
                                          'about'       : target_user.about,
                                          'id'          : target_user.id
                                      }

                                  });
            
          } else {
            res.send('<h1> Not founded(</h1>');
          }
        }
        else {
            res.redirect('/auth/login');
          }
      });
    });
  }
}

module.exports.page = page;