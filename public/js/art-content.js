canvas = document.getElementById("art_canvas");
context = canvas.getContext("2d");
canvas_width = canvas.width;
canvas_height = canvas.height;

if (canvas_width < device_width)
{
	k_width = 1;
	k_height = 1;

}
else
{
	console.log('Resizing..');
	k_width = device_width / canvas_width;
	k_height = device_height / canvas_height;
	canvas.width = device_width;
	canvas.height = device_height;
}

canvas_width = device_width;
canvas_heidth = device_height;

canvas.onmousedown = startDrawing;
canvas.onmouseup = stopDrawing;
canvas.onmouseout = stopDrawing;
canvas.onmousemove = Draw;

canvas.addEventListener("touchstart", startDrawing, false);
canvas.addEventListener("touchmove", Draw, false);
canvas.addEventListener("touchend", stopDrawing, false);
context.strokeStyle = "#fff";
context.lineJoin = "round";
context.lineWidth = 0;
	

isDrawing = false;
sensetive = 6;
curr_color = '#fff';
curr_linejoin = "miter";
curr_width = 2;

last_XY = {x:0, y:0};
lines_for_emit = [];


//socket.emit('last drawing', 'all');


socket.on('clear', function(json){
	console.log('clear event');
	context.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('drawing', function(json){
	drawEvents(json);
});

socket.on('last drawing', function(data){
	ev_list = JSON.parse(JXG.decompress(data));
	for (var i=0; i<ev_list.length; i++)
	{
		drawEvents(ev_list[i].drawing);
	}
});

function emitLines()
{
	socket.emit('drawing', lines_for_emit);
}

function drawEvents(draws_list){
	context.beginPath();
	for (var i=0; i < draws_list.length; i++){
		drawObj(draws_list[i], true);
	}
	context.closePath();
}

function getXY(e, j_canvas)
{
	canvasXY = {x:0, y:0};
	if ((e.type == 'touchstart') || (e.type == 'touchmove'))
	{
		canvasXY.x = e.targetTouches[0].pageX  - j_canvas.offset().left;
		canvasXY.y = e.targetTouches[0].pageY  - j_canvas.offset().top;
	}
	else
	{
		canvasXY.x = e.pageX - j_canvas.offset().left;
		canvasXY.y = e.pageY - j_canvas.offset().top;
	}
	return canvasXY;
}
function startDrawing(e) {
	// Начинаем рисовать
	isDrawing = true;
	canvasXY = getXY(e, $(this));
	last_XY = canvasXY;
}

function Draw(e) {
	if (e && e.preventDefault) { e.preventDefault(); }
	if (e && e.stopPropagation) { e.stopPropagation(); }
	
	if (isDrawing == true)
	{	
		new_XY = getXY(e, $(this));
    	obj = createDrawObj(last_XY, new_XY, curr_color, curr_linejoin, curr_width);
    	last_XY = new_XY;
    	drawObj(obj);
    	lines_for_emit.push(obj);
    	if (lines_for_emit.length == sensetive)
    	{
    		emitLines();
    		lines_for_emit = [];
    	}
	}
}

function stopDrawing() {
	isDrawing = false;	
	if (lines_for_emit.length != 0){
		emitLines();
   		lines_for_emit = [];
    }
}

function createDrawObj(from, to, color, line_join, line_width)
{
	obj = {
		start_x : from.x / k_width,
		start_y : from.y / k_height,
		end_x : to.x / k_width,
		end_y  : to.y / k_height,
		color : color,
		line_join : line_join,
		width : line_width
	}
	return obj;
}

function drawObj(obj, reset) {
	if (!reset){
		context.beginPath();}

	context.moveTo(obj.start_x * k_width, obj.start_y * k_height);
	context.lineTo(obj.end_x * k_width, obj.end_y * k_height);
	context.strokeStyle = obj.color;
		context.lineJoin = obj.line_join;
		context.lineWidth = obj.width;
	context.stroke();	
	if (!reset)
		context.closePath();	
}


$('.change-color-btn').click(function(e)
	{	
		context.strokeStyle = '#' + this.id;
		curr_color = '#' + this.id;
		$('.change-size-btn').css('background-color', '#' + this.id);
		$('#color-btn').css('background-color', '#' + this.id);
	});

$('#clear-btn').click(function()
	{
		context.clearRect(0, 0, canvas.width, canvas.height);
		socket.emit('clear', '');
	});

$('.change-size-btn').click(function()
	{
		curr_width = parseInt(this.id.substring(5));
		context.lineWidth = parseInt(this.id.substring(5));
	});

