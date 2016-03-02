// Avoiding the keyboard in Android causing the portrait orientation to change to landscape. 
// Not an issue in IOS. Can use window.orientation.

device_width = window.screen.availWidth,
device_height = window.screen.availHeight;

if (device_height > device_width)
{	
	tmp = device_width;
	device_width = device_height;
	device_height = tmp;
}

var currentOrientation = function() {
  // Use screen.availHeight as screen height doesn't change when keyboard displays. 
 
  console.log('Orientaion changing');
  if (screen.availWidth > 1100) {
  	$("html").addClass('desktop').removeClass('portrait').removeClass('landscape'); 
    console.log(' desktop');
    return;
  }
  if(window.screen.availHeight != device_height){
    $("html").addClass('portrait').removeClass('landscape').removeClass('desktop'); 
    console.log(' portrait');
  } else {
    $("html").addClass('landscape').removeClass('portrait').removeClass('desktop'); 
    console.log(' landscape');
  }
}

// Set orientation on initiliasation
currentOrientation();
// Reset orientation each time window is resized. Keyboard opening, or change in orientation triggers this.
$(window).on("resize", currentOrientation);

$('#logout').click(function(e) {
  console.log('logout');
  $.ajax({
      type: "DELETE",
      url: "/auth/login"
    }).error(function (data) {
  }).success(function (data) {
  setTimeout(function(){window.location.href = data.redirect; }, 1500);
  });
  window.location.href = '/auth/login';
});


// Formated date
function get_date(date) {
  if (date){
    var d = new Date(date);
  }
  else{var d = new Date();}
  var month_num = d.getMonth() + 1;
  var day = d.getDate();
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var seconds = d.getSeconds();

  month=new Array("January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "October", "December");

  if (day <= 9) day = "0" + day;
  if (hours <= 9) hours = "0" + hours;
  if (minutes <= 9) minutes = "0" + minutes;
  if (seconds <= 9) seconds = "0" + seconds;

  date_time = day + " " + month[month_num] + " " + d.getFullYear() +
  ". "+ hours + ":" + minutes + ":" + seconds;
  return date_time;
}

// Status update
update_status();

function update_status(){
  $.ajax({
      type: "PUT",
      url: "/status/"
    }).error(function (data) {
  }).success(function (data) {
    console.log(data);
    console.log('status updated')
  });
}
var updater_timerID = setInterval(update_status, 60 * 60 * 10 * 1000);
