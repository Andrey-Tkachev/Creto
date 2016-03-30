  
(function (factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) { // AMD
        define(['jquery'], factory);
    }
    else if (typeof exports == "object" && typeof module == "object") { // CommonJS
        module.exports = factory(require('jquery'));
    }
    else { // Browser
        factory(jQuery);
    }
})(function($, undefined) {
    "use strict";

    var defaultOpts = {
    	change: noop, 
    	min: 0,
    	max: 100,
    	selectedSize: 50
    };

    function noop(){

    }



    function template(opts){
    	template = 
    		['<div class="size-form"><p id="size-picker-container" class="range-field z-depth-1">',
      			'<input type="range" id="size-picker" class=""',
      				' min="' + opts.min + ' max="' + opts.max  + '" value="' + opts.selectedSize + '"/>',
			 '</p></div>'];
		//var html = '<div id="size-picker-container">' + template.join('') + '</div>';
		var html = template.join('');
		return html;
    }

    function instanceOptions(o){
    	var opts = defaultOpts;
    	if (o.change) {
    		opts.change = o.change;
    	}
    	if (o.min) {
    		opts.min = o.min;
    	}
    	if (o.max) {
    		opts.max = o.max;
    	}
    	if (o.selectedSize) {
    		opts.selectedSize = o.selectedSize;
    	}
    	return opts;
    }
    
    function sizeum(o){
    	function sizeChange(){
	    	var size = $picker.val();
	    	callbacks.change(size);
	    	hide();
    	}

    	function show(e){
    		console.log('show');
    		if (isVisible){
    			hide();
    			return;
    		}
    		isVisible = true;
    		$container.addClass('si-active');
    		$container.removeClass('si-hidden');
    		//console.log('active', e);
   		}

		function hide(){
			console.log('hide');
			isVisible = false;
			$container.addClass('si-hidden');
			$container.removeClass('si-active');
			//console.log('hidden', e);
		}


    function bodyClick(e){
    	console.log('bodyClick');
    	e.stopPropagation();
    	e.preventDefault();
    	var target = $(e.target)[0];
    
        if ( (target.id == $container.id) || (target.className == 'range-field')) {
           return;
        }
        else{
        	if (isVisible){
    			//hide();
    		}
        }
    } 

    	var $element = this,
    		isVisible = false;
     	var doc  = this.context,
            body = doc.body,
            opts = instanceOptions(o),
    		$picker    = null,
    		$container = null,
    		callbacks  = {};

        $(body).append(template(opts));
        $picker    = $('#size-picker');
        $container = $('#size-picker-container');
        hide();

        callbacks.change = opts.change;
  		$picker.change(sizeChange);
  		
  		//$(body).on('click', bodyClick);
  		$($element.selector).on('click', show);
  		
	}

	$.fn.sizeum = function(opts)
	{
		if ( typeof opts === 'object' || ! opts ) {
            // Default to "init"
            return sizeum.apply(this, arguments);
        } else {
            $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.tooltip' );
        }   
	}


})