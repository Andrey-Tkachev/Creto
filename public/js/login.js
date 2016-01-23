var isEmailValid        = false;
var isPasswordValid     = false;


$("#login-form").submit(function(e){
    e.preventDefault();
  });

$('#email').change(function() {
        checkEmailValidity();
});

function checkEmailValidity() 
{
    isEmailValid = $('#email').val().length != 0;
    console.log('email: ', isEmailValid);
    if (!isEmailValid){
      document.getElementById('email').setCustomValidity("This is a required field");
    }
    else
    {
      document.getElementById('email').setCustomValidity("");
    }

}

$('#password').change(function() {
    checkPasswordValid();
});

$('#password').keydown(function(event) {
    if (event.keyCode == 13) {
        if (checkGlobalValidity()){
          login();
        }
        return false;
    }
});


function checkPasswordValid()
{
    isPasswordValid = /.+/i.test($("#password").val());
    console.log('password: ', isPasswordValid);
    if (!isPasswordValid){
      document.getElementById('password').setCustomValidity("This is a required field");
    }
    else
    {
      document.getElementById('password').setCustomValidity("");
    }
    
}

function checkGlobalValidity()
{
  checkPasswordValid();
  checkEmailValidity();
  if (isEmailValid && isPasswordValid)
  {
    return true;
  }
  else
  {
    return false;
  }
}

$("#login-btn").click(function () { 
	if (checkGlobalValidity()){
	 login(); 
  }
  else { 
    Materialize.toast('You should fill in all the fields', 5000);
  }
});

$("#singup-btn").click(function () { 
    console.log( window.location.href);
    redir();
});

function redir(url)
{
   window.location.href = '/auth/register/';
}

function login(){
    $.ajax({
      type: "POST",
      url: "/auth/login",
      data: { email: $("#email").val(), password: $("#password").val()},
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Authorization failed', 5000);
    
	}).success(function (data) {
      console.log(data.redirect);
      window.location.href = data.redirect;
	});
}