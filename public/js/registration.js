var isEmailValid        = false;
var isPasswordValid     = false;
var isPasswordsMatches  = false;
var isNameValid         = false;
var isLastNameValid     = false;

$('#first_name').change(function() {
        checkNameValid();
});

$("#login-form").submit(function(e){
    e.preventDefault();
    return false;
});

function checkNameValid()
{
    name = $('#first_name').val();
    isNameValid = /^[A-Za-zА-Яа-я]{1,12}$/i.test(name);
    console.log(isNameValid);
    if (!isNameValid)
    {
      document.getElementById('first_name').setCustomValidity("The First Name must contain at least 1 character");
    }
    else
    {
      document.getElementById('first_name').setCustomValidity("");
    }
}

function checkLastNameValid()
{
    name = $('#last_name').val();
    isLastNameValid = /^[A-Za-zА-Яа-я]{1,12}$/i.test(name) || (name.length == 0);
    if (!isLastNameValid)
    {
      document.getElementById('last_name').setCustomValidity("Not correct last name");
    }
    else
    {
      document.getElementById('last_name').setCustomValidity("");
    }
}

$('#email').change(function() {
        checkEmailValidity();
});

function checkEmailValidity() 
{
    isEmailValid = document.getElementById('email').checkValidity();
}

$('#password').change(function() {
        checkPasswordValid();
});

function checkPasswordValid()
{
    isPasswordValid = ($("#password").val().length >= 8);
    console.log(isPasswordValid);
    if (!isPasswordValid){
      document.getElementById('password').setCustomValidity("The password must contain at least 8 characters");
    }
    else
    {
      document.getElementById('password').setCustomValidity("");
    }
}


function checkPasswordsMatches()
{
    isPasswordsMatches = ($("#password").val() == $("#password_repeat").val());
    if (!isPasswordsMatches){
      document.getElementById('password_repeat').setCustomValidity("Passwords do not match");
    }
    else
    {
      document.getElementById('password_repeat').setCustomValidity("");
    }
}

function checkGlobalValidity()
{
  checkNameValid();
  checkLastNameValid();
  checkEmailValidity();
  checkPasswordValid();
  checkPasswordsMatches();

  if (isEmailValid && isPasswordValid && isPasswordsMatches && isNameValid && isLastNameValid)
  {
    return true;
  }
  else
  {
    return false;
  }
}

$("#create-account").click(function (){
  if (checkGlobalValidity()){
    registeruser();
  }
  else{
     Materialize.toast('You should fill in all the fields', 5000);
  }
});

function registeruser(){
    $.ajax({
      type: "POST",
      url: "/auth/register",
      data: { email: $("#email").val(), password: $("#password").val(), last_name :$("#last_name").val(), first_name :$("#first_name").val() },
      dataType: "json"
    }).error(function (data) {
      Materialize.toast('Registration faild: this email is already used', 5000);
    
  }).success(function (data) {
      Materialize.toast('Registration success', 5000);
      Materialize.toast('You will be redirected to the login page', 5000);
      setTimeout(function(){window.location.href = data.redirect; }, 1500);
  });
}