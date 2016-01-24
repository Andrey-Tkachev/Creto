function create_person(person_data, type){
  var container = document.createElement('div');  
      container.className = 'card-container';
  
  var card = document.createElement('div');
      card.className = 'card';
  // Image block
  var card_image = document.createElement('div');
      card_image.className = 'card-image waves-effect waves-block waves-light';

  var img = document.createElement('img');
      img.className = 'activator';
      img.src = person_data.thumb;

  card_image.appendChild(img);
  
  // Content block
  var card_content = document.createElement('div');
      card_content.className = 'card-content';

  var card_title = document.createElement('span');
      card_title.className = 'card-title';
      card_title.innerHTML = '<a href="/' + person_data.id + '">' + person_data.full_name + '<i class="material-icons right">more_vert</i></a>';

  var p_activator = document.createElement('p');
      p_activator.innerHTML = '<a class="activator">About</a>';

  var p_add_to_frds = document.createElement('p');
  if (type != '#friends'){
    if (type == '#friends-requests') {
      inner = 'class="accept-friendship">Accept</a> ' +  '<a name="' + person_data.id + '" class="reject-friendship"> Reject </a>';
    }
    else {
      inner =  'class="add-to-friend">Add to friends</a>';
    } 
  }
  else {
    inner = 'class="delete-from-friends">Delete from friends</a>';
  }
  
  p_add_to_frds.innerHTML = '<a name="' + person_data.id + '"' + inner;
  
  card_content.appendChild(card_title);
  card_content.appendChild(p_activator);
  card_content.appendChild(p_add_to_frds);
  
  // Reval block
  var card_reveal = document.createElement('div');
      card_reveal.className = 'card-reveal';

  var span_reveal = document.createElement('span');
      span_reveal.className = 'card-title';
      span_reveal.innerHTML = person_data.full_name + '<i class="material-icons right">close</i>'


  var p_about = document.createElement('p');
      p_about.innerHTML = person_data.about;

  card_reveal.appendChild(span_reveal);
  card_reveal.appendChild(p_about);

  // Cretaion block

  card.appendChild(card_image);
  card.appendChild(card_content);
  card.appendChild(card_reveal);
  container.appendChild(card);
  $(type).append(container);

}

function delete_from_friends() {
  $.ajax({
      type: "DELETE",
      url: "/people/request",
      data: { id : $(this).attr('name')},
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Delete error.', 5000);
  }).success(function (data) {
    msg = 'User has been deleted from your friends';
    if (data.status != 200)
      msg = 'Your are not friends';
    Materialize.toast(msg, 5000);
    check_friends();
  });
}

function friend_request() {
  console.log('friend request to', $(this).attr('name'));
  $.ajax({
      type: "POST",
      url: "/people/request",
      data: { id : $(this).attr('name')},
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Request sending error.', 5000);
    
  }).success(function (data) {
    msg = 'Request sent. Wait until the user confirm your friendship confirmation.';
    if (data.status != 200)
      msg = 'You have already sent a request';
    Materialize.toast(msg, 5000);
  });
}

function reject_friendship() {
  $.ajax({
      type: "POST",
      url: "/people/request/reject",
      data: { id : $(this).attr('name') },
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Rejecting error.', 5000);
    
  }).success(function (data) {
      msg = "You have rejected friendship";
      if (data.status != 200)
        msg = 'Friend requests rejecting error';
      Materialize.toast(msg, 5000);

      $(this).parent(".card").remove();
      check_requests();
      check_people();
  });
}

function accept_friendship(){
  console.log('accept ', $(this).attr('name'));
  $.ajax({
      type: "POST",
      url: "/people/request/accept",
      data: { id : $(this).attr('name') },
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Accepting error.', 5000);
    
  }).success(function (data) {
      msg = "Now your a friends";
      if (data.status != 200)
        msg = 'Friend requests accepting error';
      Materialize.toast(msg, 5000);

      $(this).parent(".card").remove();
      check_friends();
      check_requests();
  });
}

//People getting
function check_people() {
    $.ajax({
      type: "GET",
      url: "/people/all",
      data: {},
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('People get error', 5000);

    }).success(function (data) {
      peoples = JSON.parse(data.peoples);
      for (var i=0; i<peoples.length; i++)
      {
        create_person(peoples[i], '#people');
      }
      $('.add-to-friend').click(friend_request);
      console.log(data);
    });
}
// Friends getting
function check_friends() {
  $.ajax({
      type: "GET",
      url: "/people/friends",
      data: { selector : {}},
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Friends get error', 5000);
    
    }).success(function (data) {
        peoples = JSON.parse(data.peoples);
        if (peoples.length != 0){
          $('#friends').empty()
        }
        for (var i=0; i<peoples.length; i++)
        {
          create_person(peoples[i], '#friends');
        }
        $('.delete-from-friends').click(delete_from_friends);
        console.log(data);
    });

}

// Requests getting
function check_requests () 
{
   $('#friends-requests').empty();
  $.ajax({
      type: "GET",
      url: "/people/requests",
      data: { selector : {}},
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Requests get error', 5000);
    
  }).success(function (data) {
      peoples = JSON.parse(data.peoples);
      if (peoples.length != 0){
        $('#friends-requests').empty();
        $(".requests-indicator").show();
        $(".requests-indicator").innerHTML = peoples.length + ' new';
      }
      else
      {
        $(".requests-indicator").hide();
      }
      for (var i=0; i<peoples.length; i++)
      {
        create_person(peoples[i], '#friends-requests');
      }
      $('.accept-friendship').click(accept_friendship);
      $('.reject-friendship').click(reject_friendship);
      console.log(data);
  });
}
check_friends();
check_requests();
check_people();