 	$("#editor-form").submit(function(e){
    	e.preventDefault();
    	checkLastNameValid();
		checkNameValid();
		console.log('butt clicked');
		if (isLastNameValid && isNameValid)
		{
			save();
		}
		else
		{
			Materialize.toast('Not correct Name or Last name', 5000);
			return false;
		}
  	});

  	var isNameValid         = false;
	var isLastNameValid     = false;

  	var status = 'None';

  	function statusChange(new_status){
  		status = new_status;
  	}

  	function checkNameValid()
	{
	    name = $('#first-name').val();
	    isNameValid = /^[A-Za-zА-Яа-я]{1,12}$/i.test(name);
	    console.log(isNameValid);
	    if (!isNameValid)
	    {
	      document.getElementById('first-name').setCustomValidity("The First Name must contain at least 1 character");
	    }
	    else
	    {
	      document.getElementById('first-name').setCustomValidity("");
	    }
	}

	function checkLastNameValid()
	{
		name = $('#last_name').val();
		isLastNameValid = /^[A-Za-zА-Яа-я]{1,12}$/i.test(name) || (name.length == 0);
		if (!isLastNameValid)
		{
		  document.getElementById('last-name').setCustomValidity("Not correct last name");
		}
		else
		{
		  document.getElementById('last-name').setCustomValidity("");
		}
	}
	

  	function save()
  	{	
  		console.log('saving..', $('#birthdate').val());
	    $.ajax({
	      type: "POST",
	      url: "/edit/",
	      data: { 	first_name	: $("#first-name").val(), 
	      			last_name	: $("#last-name").val(),
	      			birthdate	: $('#birthdate').val(),
	      			homecity    : $('#homecity').val(),
	      			status      : status,
	      			about		: $('#about-textarea').val() 
	      		},

	      dataType: "json"}).error(function (data)
	    {
	      Materialize.toast('Error', 5000);
	    
		}).success(function (data) 
		{
	      Materialize.toast('Data saved successfully', 5000);
	 	});
	}
 $(document).ready(function() {
 	$('#submit-btn').click( function() {
		checkLastNameValid();
		checkNameValid();
		console.log('butt clicked');
		if (isLastNameValid && isNameValid)
		{
			save();
		}
		else
		{
			Materialize.toast('Not correct Name or Last name', 5000);
		}

	});

	$('select').material_select();

	$('#birthdate').pickadate({

		selectMonths: true, // Creates a dropdown to control month
   		selectYears: 100 // Creates a dropdown of 15 years to control year
		
	});
		//Copy settings and initialization tooltipped


 });