canva = {
	canvas         : null,
	context        : null,
	socket         : null,
	sensetive      : 6,
	lastXY 		   : { x: 0, 
					   y: 0 },
	isDrawing      : false,
	linesForEmit: [],

	lineStyle: {
		strokeStyle : "#fff",
		lineJoin    : "mitter",
		lineWidth   : 2
	},

	init: function(socket, device_scale, sensetive) {
	  this.device_scale = device_scale;
	  if (sensetive)
	  	this.sensetive = sensetive;  
	  this.cacheDOM();
	  this.adaptScale();
	  this.initPallete();
	  this.socket = socket;
      this.bindEvents();

	},

	cacheDOM: function() {
	  this.canvas  = document.getElementById("art_canvas");
	  this.context = this.canvas.getContext("2d");
	  
	  this.$canvas    = $("#art_canvas");
      this.$size_btn  = $('.change-size-btn');
      this.$color_btn = $('.change-color-btn');
      this.$clear_btn = $('#clear-btn');
    },

	bindEvents: function() {
	  this.$size_btn.on('click', this.changeSize.bind(this));
	  this.$clear_btn.on('click', this.clearCanvas.bind(this, {push_change: true}));
	  
	  this.canvas.onmousedown = this.startDrawing.bind(this);
	  this.canvas.onmouseup   = this.stopDrawing.bind(this);
	  this.canvas.onmouseout  = this.stopDrawing.bind(this);
	  this.canvas.onmousemove = this.Draw.bind(this);

	  this.canvas.addEventListener("touchstart", this.startDrawing.bind(this), false);
	  this.canvas.addEventListener("touchmove", this.Draw.bind(this), false);
	  this.canvas.addEventListener("touchend", this.stopDrawing.bind(this), false);

	  this.socket.on('clear',    this.clearCanvas.bind(this, {push_change: false}));
	  this.socket.on('drawing',  this.drawObj.bind(this));
	  global_this = this;
	  this.socket.on('last drawing', function(data){
									ev_list = JSON.parse(JXG.decompress(data));
									for (var i=0; i<ev_list.length; i++)
									{
										global_this.drawObj(ev_list[i].drawing);
									}
									$('.progress').remove(); 
									$('.indeterminate').remove();
								});
	},

	adaptScale: function(){
		device_width = this.device_scale.device_width;
		device_height = this.device_scale.device_height;
		canvas_width  = this.canvas.width;
		canvas_height = this.canvas.height;
		
		this.width_ratio  = 1;
		this.height_ratio = 1;
		
		if (canvas_width > device_width)
		{
			this.width_ratio  = device_width / canvas_width;
			this.height_ratio = device_height / canvas_height;
			this.canvas.width  = device_width;
			this.canvas.height = device_height;
		}
	},

    initPallete: function() {
    	color_btn = this.$color_btn;
    	size_btn  = this.$size_btn;
    	global_this = this;
    	this.$color_btn.spectrum({
		    showPalette: true,
		    showSelectionPalette: true,
		    clickoutFiresChange: true,
		    showInitial: true,
		    //showInput: true,
		    allowEmpty:true,
		    preferredFormat: "hex",
		    palette: [
		        ['red', 'yellow', 'green', 'blue', 'black', 'white'],
		    ],
		    //showAlpha: true,
		    change: function(color) {
		    	color = color.toHexString(); 
		    	global_this.lineStyle.strokeStyle = color;

				color_btn.css('background-color', color);
				size_btn.css('background-color', color);
			}
		});
    },
    
    getXY: function(e, $canvas)
	{

		canvasXY = {x:0, y:0};
		if ((e.type == 'touchstart') || (e.type == 'touchmove'))
		{
			canvasXY.x = e.targetTouches[0].pageX  - $canvas.offset().left;
			canvasXY.y = e.targetTouches[0].pageY  - $canvas.offset().top;
		}
		else
		{
			canvasXY.x = e.pageX - $canvas.offset().left;
			canvasXY.y = e.pageY - $canvas.offset().top;
		}
		return canvasXY;
	},

	startDrawing: function(e) {
		this.isDrawing = true;
		canvasXY = this.getXY(e, this.$canvas);

		this.last_XY = canvasXY;
		
		this.context.beginPath();
		this.context.moveTo (canvasXY.x * this.width_ratio, 
							 canvasXY.y * this.height_ratio);
	},

	Draw: function(e) {

		if (e && e.preventDefault) { e.preventDefault(); }
		if (e && e.stopPropagation) { e.stopPropagation(); }
		
		if (this.isDrawing == true)
		{	

			new_XY = this.getXY(e, this.$canvas);
	    	obj = this.createDrawObj(this.last_XY, 
	    							 new_XY, 
	    							{ style: this.lineStyle,
	    							  ratio: 
									     {
									     	width_ratio : this.width_ratio,
									    	height_ratio: this.height_ratio
									     }});

	    	
	    	this.last_XY = new_XY;

	    	this.context.lineTo(obj.end_x * this.width_ratio, 
	    						obj.end_y * this.height_ratio);

	    	this.context.strokeStyle = this.lineStyle.strokeStyle;
			this.context.lineJoin 	 = this.lineStyle.lineJoin;
			this.context.lineWidth 	 = this.lineStyle.lineWidth;
			this.context.stroke();
		
	    	this.linesForEmit.push(obj);
	    	if (this.linesForEmit.length == this.sensetive)
	    	{
	    		this.emitLines();
	    		this.linesForEmit = [];
	    	}
		}
	},

	stopDrawing: function() {
		this.context.closePath();
		this.isDrawing = false;	
		if (this.linesForEmit.length != 0){
			this.emitLines();
	   		this.linesForEmit = [];
	    }
	},

	createDrawObj: function(from, to, params)
	{
		obj = {
			start_x : from.x / params.ratio.width_ratio,
			start_y : from.y / params.ratio.height_ratio,
			end_x   : to.x / params.ratio.width_ratio,
			end_y   : to.y / params.ratio.height_ratio,
			color     : params.style.strokeStyle,
			line_join : params.style.lineJoin,
			width     : params.style.lineWidth,
		}

		return obj;
	},

	drawObj: function(objs, opts) {

		path = new Path2D();
		path.moveTo(objs[0].start_x * this.width_ratio, 
			objs[0].start_y * this.height_ratio);

	    for (var i=0; objs&&(i < objs.length); i++){
	    	obj = objs[i];
			path.lineTo(obj.end_x * this.width_ratio, 
						obj.end_y * this.height_ratio);
		}
		
		this.context.strokeStyle = obj.color;
		this.context.lineJoin 	 = obj.line_join;
		this.context.lineWidth 	 = obj.width;

		this.context.stroke(path);	
	},

    changeSize: function(event){
    	console.log('Resizing');
		this.lineStyle.lineWidth = parseInt(event.target.name);
		this.context.lineWidth = this.lineStyle.lineWidth;
	},

	clearCanvas: function(params) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if ((params) && (params.push_change)){
			this.socket.emit('clear', '');
		}
	},

	emitLines: function()
	{
		this.socket.emit('drawing', this.linesForEmit);
	}
}


device_scale = { device_width  : device_width, 
				 device_height : device_height }
sensetive = 12;
canva.init(socket, device_scale, sensetive);