var multer            = require('multer');
var fs                = require('fs');
var UserModel         = require('./mongo-db-manager').UserModel;
var xssFilters        = require('xss-filters');
var url               = require("url");
var log               = require('./log')(module);
var easyimg           = require('easyimage');
var chai              = require('chai');
var chaiAsPromised    = require('chai-as-promised');
    chai.use(chaiAsPromised);
    chai.should();
var assert            = chai.assert;
var expect            = chai.expect;


var storage = multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, global.__approot + '/public/users/' + req.session.user_id);
      },
      filename: function (req, file, callback) {
        UserModel.update({ _id: req.session.user_id }, { $set: { images: {url: ('users/' + req.session.user_id + '/avatar')} }}, function(e) {});
        console.log('creating file');
        callback(null, 'avatar');
      }
});

var upload = multer({ storage : storage}, {limits : {fieldNameSize : 200}}).single('userPhoto');

// WARNING!!!!
function edit(req, res){
    log.info('Change req');
    UserModel.update({ _id: req.session.user_id }, { $set: req.body}, // NOT SAFE!!
      function(e) {
        if(e)
        {
          res.sendStatus(500);
        }
        else
        {
          res.end(JSON.stringify({status : 200}));
        }
     });
}


function page(req, res){
    UserModel.findById(req.session.user_id, function(err, user) {
      if (user) {
        res.render('../public/html/page_edit.html', 
                                        {'self': true,
                                            'person' :  {
                                              'first_name'      : user.first_name,
                                              'last_name'       : user.last_name,
                                              'images'          : user.images.url,
                                              'about'           : xssFilters.inHTMLData(user.about),
                                              'friends'         : user.friends,
                                              'birthdate'       : user.birthdate,
                                              'homecity'        : xssFilters.inHTMLData(user.homecity),
                                              'marital_status'  : xssFilters.inHTMLData(user.marital_status),
                                              'name'            : user.full_name
                                            }
                                        });
      }
    });
}

function delete_file(file_dest) {
  fs.unlink(file_dest, function(err) {
    });
}

function makedir(dir) {
  if (!fs.exists(dir)) {
      fs.mkdir(dir, function(e){
        if(!e || (e && e.code === 'EEXIST')){
            log.info('Dir creating: ' + dir)
        } else {
            //debug
            log.error('Dir creating error: ' + e.code);
        }
    });
  }
}

function change_avatar(req, res){
    new_dir = __approot + '/public/users/' + req.session.user_id + '/';

    makedir(new_dir);

    upload(req, res, function(err) {
        log.info(req.file.originalname, ' uploaded');
        path_to_thumb =  req.file.destination + '/' + req.file.filename + '_thumb';
        path_to_file  =  req.file.destination + '/' + req.file.filename;

        file_size = {width : 0, height : 0};
        easyimg.info(path_to_file).then(
            function(file) {
                file_size.width = file.width;
                file_size.height = file.height;
            }, function (err) {
                console.log(err);
            }
        );

        easyimg.thumbnail({
            src:path_to_file, dst: path_to_thumb,
            width:400, height:400,
            x:0, y: 0
        }).then(function (file) {
            UserModel.update({ _id: req.session.user_id }, 
              { $set: { thumb: {url: ('users/' + req.session.user_id + '/avatar_thumb')} }}, function(e) {});
            file.should.be.a('object');
            file.should.have.property('width');
            file.width.should.be.equal(400);
            log.info('Thumb created');
        });

        if(err) {
            return res.end("Error uploading file.");
        }
        res.redirect('/');
    });
}

module.exports.page          = page;
module.exports.edit          = edit;
module.exports.change_avatar = change_avatar;