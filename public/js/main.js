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