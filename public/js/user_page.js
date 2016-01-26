window.onload = function() {
	$('#file-input').change( function() {
		$("#uploadForm").submit();
	});
	$('#logout').click(function(e) {
		console.log('deleting..');
	    $.ajax({
	      type: "DELETE",
	      url: "/auth/login",
	      dataType: "json"
	    }).error(function (data) {
	  	}).success(function (data) {
			setTimeout(function(){window.location.href = data.redirect; }, 1500);
	  	});
	  window.location.href = '/auth/login';
	});

  $('#add-to-friends-btn').click( function() {
	  console.log('friend request to', $(this).attr('name'));
	  $.ajax({
	      type: "POST",
	      url: "/people/request",
	      data: { id : $(this).attr('name')},
	      dataType: "json"
	    }).error(function (data) {
	      Materialize.toast('Request error.', 5000);
	    
	  }).success(function (data) {
	      Materialize.toast('Request sent. Wait until the user confirm your friendship confirmation.', 5000);
	  });
	});
}