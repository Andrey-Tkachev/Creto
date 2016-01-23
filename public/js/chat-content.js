
var socket = io.connect(window.location.protocol + "//" + window.location.host + '/');
socket.emit('last messages', 'all');



function create_message(message, author, pic, date, user_id)
{
	var new_mess = document.createElement('li');	
	new_mess.className = 'collection-item avatar';
	
	var message_container = document.createElement('div');
	message_container.className = 'message-container';

	var img = document.createElement('img');
	img.className = 'circle person-img';
	img.src = pic;

	var span = document.createElement('span');
	span.className = 'title';
	span.innerHTML = '<a href="/' + user_id +'">' + author + '</a>';

	var p = document.createElement('p');
	p.className = 'message-text';
	p.innerHTML = message;


	var a = document.createElement('a');
	a.className = 'secondary-content blue-text hide-on-portrait-tablet';
	a.innerHTML = date;

	message_container.appendChild(img);
	message_container.appendChild(span);
	message_container.appendChild(p);
	message_container.appendChild(a);
	new_mess.appendChild(message_container);

	return new_mess;
}

function add_message(message)
{
	$('#messages').append(message);
	var scrollinDiv = document.getElementById('messages-row');
	scrollinDiv.scrollTop = 1000000;
}
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


$('#message_area').keydown(function(event) {
    if (event.keyCode == 13) {
        submit();
        return false;
    }
});
$('#send-btn').click(function(e) {
	submit();
});

function decode_utf8( s )
{
  return decodeURIComponent( escape( s ) );
}

function encode_utf8( s )
{
  return unescape( encodeURIComponent( s ) );
}

function submit(){
    message_text = $('#message_area').val();
    if (!message_text)
    {
		return;    	
    }
	$('#message_area').val('');
	socket.emit('message', message_text);
}



function process_message(json)
{
	//console.log(json);
	date = get_date(json.date);
	_person_img = json.user_ref.thumb.url;
	person_name = decode_utf8(json.user_ref.first_name + ' ' + json.user_ref.last_name);
	message_text = json.message_text;
	message = create_message(decode_utf8(message_text), person_name, _person_img, date, json.user_ref._id);
	add_message(message);
}

socket.on('message', function(data){
	console.log('message event')
	process_message(JSON.parse(JXG.decompress(data)));
});

socket.on('last messages', function(data){
	var messages_list = JSON.parse(JXG.decompress(data));
    for (var msg_id=0; msg_id < messages_list.length; msg_id++){
		process_message(messages_list[msg_id]);
	}
	$('.progress').remove(); 
	$('.indeterminate').remove(); 
});


