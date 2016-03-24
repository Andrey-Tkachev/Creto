var socket = io.connect(window.location.protocol + "//" + window.location.host + '/');

var chat = {
    messageToSend: '',
    init: function(user_id, socket) {
      this.cacheDOM();
      this.bindEvents();
      this.user_id = user_id;
      this.socket  = socket;
    },
    cacheDOM: function() {
      this.$chatHistory = $('.chat-history');
      this.$button = $('button');
      this.$textarea = $('#message-to-send');
      this.$chatHistoryList =  this.$chatHistory.find('ul');
    },
    bindEvents: function() {
      this.$button.on('click', this.addMessageButton.bind(this));
      this.$textarea.on('keyup', this.addMessageEnter.bind(this));
    },
    render: function(message, template_type) {

      this.scrollToBottom();
      if (message.text.trim() !== '') {
        var template = Handlebars.compile( $(template_type).html() );
		
        this.$chatHistoryList.append(template(message));
        this.scrollToBottom();
      }
      
    },

    process_message: function(json)
	{
		date 			= json.date;
		person_status  = json.user_ref.status;
		person_name 	= decode_utf8(json.user_ref.first_name + ' ' + json.user_ref.last_name);
		message_text 	= decode_utf8(json.message_text);
		
		message = {
			author 		: person_name,
			status 		: person_status,
			text   		: message_text,
			time        : this.getTime(date)
		}

		if (json.user_ref._id == this.user_id)
			this.addMessage(message, "#message-template");
		else 
			this.addMessage(message, "#message-response-template");

	},

    addMessage: function(message, template) {
      this.render(message, template);         
    },
    addMessageEnter: function(event) {
        // enter was pressed
        if (event.keyCode === 13) {
          message_text = this.$textarea.val();
          if (message_text.trim() !== '') 
          	this.socket.emit('message', message_text);
         this.$textarea.val('');
        }
    },
    addMessageButton: function(event) {
        // butt was pressed
         message_text = this.$textarea.val();
          if (message_text.trim() !== '') 
          	this.socket.emit('message', message_text);
         this.$textarea.val('');
    },
    scrollToBottom: function() {
       this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
    },
    getTime: function(date) {
      return new Date(date).toLocaleTimeString().
              replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
    }
    
  };
  




var room_id = window.location.href.split('/').pop();
var user_id = '';

is_active = true;

window.onblur = function () { is_active = false; document.title='Creto'; }
window.onfocus = function () { is_active = true; document.title='Creto';  console.log('on focus');}

function join_room(){
	socket.emit('join room', {id : room_id});
}
join_room();


function decode_utf8( s )
{
  return decodeURIComponent( escape( s ) );
}

function encode_utf8( s )
{
  return unescape( encodeURIComponent( s ) );
}


var reconectTimer = setInterval(join_room, 10 * 1000);

socket.on('status',	function(data){
	if (data.status == 'ok'){
		user_id = data.user_id;
		chat.init(user_id, socket);
		$('#room-img').attr('src', data.target.thumb.url);
		$('.chat-with').html('Chat with ' + data.target.first_name + ' ' + data.target.last_name);
		$('.chat-num-messages').html(data.target.status);
		socket.emit('last messages', 'all');
		socket.emit('last drawing', 'all');
	}
});

socket.on('message', function(data){	
	if (!is_active){
		$('#chatAudio')[0].play();
		document.title = '*** New massage ***';
	}
	chat.process_message(JSON.parse(JXG.decompress(data)));
});

socket.on('last messages', function(data){
	var messages_list = JSON.parse(JXG.decompress(data));
    for (var msg_id=0; msg_id < messages_list.length; msg_id++){
		chat.process_message(messages_list[msg_id]);
	}
	 
});
