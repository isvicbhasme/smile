'use strict';
var appModule = angular.module('app.controllers', ['app.services']);

appModule.controller('AppCtrl', function($scope, $state, AuthService, AuthServiceConstants, MenuListService, HistoryService) {

  AuthService.verifyAuthentication();
  var isLoggedIn = AuthService.getIsAuthenticated();
  if(!isLoggedIn) {
    HistoryService.clearAllAndDontStoreThisPage();
    $state.go('login');
    return;
  }
  else
  {
    $scope.menuItems = MenuListService.getMenuList(isLoggedIn);
  }

  $scope.logout = function() {
    Parse.User.logOut().then(
      function(){
      HistoryService.clearAllAndDontStoreThisPage();
      AuthService.clearUser();
      $state.go('login');
    }, function(error) {
        alert("Error: " + error.code + " " + error.message);
    });
  }

});

appModule.controller('ArticlesCtrl', function($scope) {
  $scope.articles = [
    { title: 'Report - 1st Jan 2015', id: 1, type: 'Announcement' },
    { title: 'Report - 2nd Jan 2015', id: 2, type: 'Article' },
    { title: 'Report - 3rd Jan 2015', id: 3, type: 'Announcement' },
    { title: 'Report - 4th Jan 2015', id: 4, type: 'Event' },
    { title: 'Report - 5th Jan 2015', id: 5, type: 'Article' },
    { title: 'Report - 6th Jan 2015', id: 6, type: 'Announcement' }
  ];
});

appModule.controller('LoginCtrl', function($scope, $state, AuthService, AuthServiceConstants, MenuListService, HistoryService){
  $scope.loginData = {
    username: '',
    minUsernameLength : AuthServiceConstants.minUsernameLength,
    maxUsernameLength : AuthServiceConstants.maxUsernameLength,
    minPasswordLength : AuthServiceConstants.minPasswordLength,
    maxPasswordLength : AuthServiceConstants.maxPasswordLength
  };

  AuthService.verifyAuthentication();
  var isLoggedIn = AuthService.getIsAuthenticated();
  if(isLoggedIn) {
    HistoryService.clearAllAndDontStoreThisPage();
    $state.go('app.articles');
  }

  function isFormValid() {
    var result = { valid: false, message: ""};
    if(!$scope.loginData.username ||
        $scope.loginData.username.length < AuthServiceConstants.minUsernameLength ||
        $scope.loginData.username.length > AuthServiceConstants.maxUsernameLength)
    {
      result.message = "Please check your username";
      return result;
    }

    if(!$scope.loginData.password ||
        $scope.loginData.password.length < AuthServiceConstants.minPasswordLength ||
        $scope.loginData.password.length > AuthServiceConstants.maxPasswordLength)
    {
      result.message = "Please check your password";
      return result;
    }
    result.valid = true;
    return result;
  }

  $scope.doLogin = function() {
    var validationResult = isFormValid();
    if(!validationResult.valid)
    {
      alert("Oops! "+validationResult.message);
      return;
    }
    Parse.User.logIn($scope.loginData.username, $scope.loginData.password)
    .then(function(user) {
      HistoryService.clearAllAndDontStoreThisPage();
      console.log(user);
      AuthService.setUserInfo(user);
      $state.go('app.articles');
    },function(error) {
      alert("Error: " + error.code + " " + error.message);
      return;
    });
  }
});

appModule.controller('RegisterCtrl', function($scope, $state, AuthService, AuthServiceConstants){
  $scope.loginData = {
    minUsernameLength : AuthServiceConstants.minUsernameLength,
    maxUsernameLength : AuthServiceConstants.maxUsernameLength,
    minPasswordLength : AuthServiceConstants.minPasswordLength,
    maxPasswordLength : AuthServiceConstants.maxPasswordLength
  };

  function isFormValid() {
    var result = { valid: false, message: ""};
    if(!$scope.loginData.username ||
        $scope.loginData.username.length < AuthServiceConstants.minUsernameLength ||
        $scope.loginData.username.length > AuthServiceConstants.maxUsernameLength)
    {
      result.message = "Please check your username";
      return result;
    }

    if(!$scope.loginData.email || $scope.loginData.email.test)
    {
      result.message = "Please enter a valid email"
      return result;
    }

    if(!$scope.loginData.password ||
        $scope.loginData.password.length < AuthServiceConstants.minPasswordLength ||
        $scope.loginData.password.length > AuthServiceConstants.maxPasswordLength)
    {
      result.message = "Please check your password";
      return result;
    }

    if(!$scope.loginData.confirmPassword ||
        $scope.loginData.password != $scope.loginData.confirmPassword)
    {
      result.message = "Your passwords do not match";
      return result;
    }
    result.valid = true;
    return result;
  }

  $scope.onRegister = function() {
    var validationResult = isFormValid();
    if(!validationResult.valid)
    {
      alert("Oops! "+validationResult.message);
      return;
    }
    var user = new Parse.User();
    user.set("username", $scope.loginData.username);
    user.set("email", $scope.loginData.email);
    user.set("password", $scope.loginData.password);
    user.signUp(null, {
      success: function(user) {
        alert("Registration successful! You may login now.")
        $state.go('login');
      },
      error: function(user, error) {
        alert("Oops! " + error.code + " " + error.message);
        return;
      }
    })
  }
});

appModule.controller('ArticleCtrl', function($scope, $stateParams) {
  $scope.id = $stateParams.articleId;
  $scope.type = $stateParams.type;
});

