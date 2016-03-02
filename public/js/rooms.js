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
  window.location.href = $(this).attr('id');
}

function create_room(room_data){
  //console.log(room_data.room._id);
  var item = create_element('div', 'item z-depth-1 click', '','/room/' + room_data.room._id);
  console.log(item.name);
  var column_small = create_element('div', 'column small');
  var column_large = create_element('div', 'column large');


  // Image block
  var img = create_element('img', '');
      img.src = room_data.thumb.url;

  column_small.appendChild(img);
  
  // Content block
  var dialog_info = create_element('div', 'dialog-info');

  // Dialog name
  var person_name = create_element('h5');
      person_name.innerHTML =  room_data.full_name;
  
  var date = create_element('h6');
  if (room_data.status.status == 'offline')
      date.innerHTML = 'offline<br>' + get_date(room_data.status.last_visit);
  else
      date.innerHTML = 'online';

  dialog_info.appendChild(person_name);
  dialog_info.appendChild(date);

  column_small.appendChild(dialog_info);

  var last_message = document.createElement('h5');
  if (room_data.last_message){  
      var last_message_th     = create_element('img', '');
          last_message_th.src = room_data.last_message.thumb.url;
      column_large.appendChild(last_message_th);

      if ( room_data.last_message.message_text.length >= 40){
        last_message.innerHTML = room_data.last_message.message_text.substr(0, 39) + '...';
      }
      else{
        last_message.innerHTML = room_data.last_message.message_text;
      }
  }
  else
      last_message.innerHTML = 'empty'

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
  if (id){
    element.id = id;
  }
  return element
}
