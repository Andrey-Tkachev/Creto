// Rooms getting
function get_rooms() {
  $.ajax({
      type: "GET",
      url: "/rooms/list",
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Rooms get error', 5000);
    
    }).success(function (data) {
        console.log(data);
        rooms = data.rooms;
        if (rooms.length != 0){
          $('#content-wrapper').empty()
        }
        for (var i=0; i<rooms.length; i++)
        {
          create_room(rooms[i]);
        }
        $('.click').click(enter_room);
        
    });

}

get_rooms();


function enter_room()
{
  window.location.href = $(this).attr('name');
}

function create_room(room_data){
  //console.log(room_data.room._id);
  var item = create_element('div', 'item z-depth-1');
  var column_small = create_element('div', 'column small');
  var column_large = create_element('div', 'column large');


  // Image block
  var img = create_element('img', 'click', '/room/' + room_data.room._id);
      img.src = room_data.thumb.url;

  column_small.appendChild(img);
  
  // Content block
  var dialog_info = create_element('div', 'dialog-info');

  var person_name = create_element('h5');
      person_name.innerHTML =  room_data.full_name;
  
  var date = create_element('h6');
  if (room_data.date)
      date.innerHTML = room_data.date;

  dialog_info.appendChild(person_name);
  dialog_info.appendChild(date);

  column_small.appendChild(dialog_info);

  var last_message = document.createElement('h4');
      last_message.innerHTML = room_data.last_message;
  
  column_large.appendChild(last_message);
  
  item.appendChild(column_small);
  item.appendChild(column_large);
  $('#content-wrapper').append(item);

}

function create_element(type, el_class, name, id){
  var element = document.createElement(type);
  if (el_class) {
      element.className = el_class;
    }
  if (name){
    element.name = name;
  }
  return element
}
