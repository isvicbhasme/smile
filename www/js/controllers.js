'use strict';
var appModule = angular.module('app.controllers', ['app.services']);

appModule.controller('AppCtrl', function($scope, $state, AuthService, MenuListService, HistoryService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  // $scope.$on('$ionicView.enter', function(e) {
  // });

  // Form data for the login modal
  $scope.loginData = {
    username: ''
  };
  $scope.temp = AuthService.verifyAuthentication();
  var isLoggedIn = AuthService.getIsAuthenticated();
  $scope.menuItems = MenuListService.getMenuList(isLoggedIn);
  if(isLoggedIn) {
    console.log("Already logged in");
    HistoryService.clearAllAndDontStoreThisPage();
    $state.go('app.articles');
  }

  // Create the login modal that we will use later
  // $ionicModal.fromTemplateUrl('templates/login.html', {
  //   scope: $scope
  // }).then(function(modal) {
  //   $scope.modal = modal;
  // });

  // Triggered in the login modal to close it
  // $scope.closeLogin = function() {
  //   $scope.modal.hide();
  // };

  // Open the login modal
  // $scope.showlogin = function() {
  //   $scope.modal.show();
  // };

  $scope.logout = function() {
    Parse.User.logOut().then(
      function(){
      HistoryService.clearAllAndDontStoreThisPage();
      AuthService.clearUser();
      $scope.menuItems = MenuListService.getMenuList(AuthService.getIsAuthenticated());
      $state.go('login');
    }, function(error) {
        alert("Error: " + error.code + " " + error.message);
    });
  }

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    Parse.User.logIn($scope.loginData.username, $scope.loginData.password)
    .then(function(user) {
      HistoryService.clearAllAndDontStoreThisPage();
      console.log(user);
      AuthService.setUserInfo(user);
      $scope.menuItems = MenuListService.getMenuList(AuthService.getIsAuthenticated());
      $state.go('app.articles');
    },function(error) {
      alert("Error: " + error.code + " " + error.message);
      $tate.go()
    });
  };

  $scope.showRegistration = function() {
    $state.go('register');
  };
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

appModule.controller('RegisterCtrl', function($scope, AuthService){
  $scope.registerData = {};

  // todo: confirm password check
  $scope.onRegister = function() {
    var user = new Parse.User();
    user.set("username", $scope.registerData.username);
    user.set("email", $scope.registerData.email);
    user.set("password", $scope.registerData.password);
    user.signUp(null, {
      success: function(user) {
        console.log(AuthService.getMessage());
      },
      error: function(user, error) {
        console.log(AuthService.getMessage());
        alert("Error: " + error.code + " " + error.message);
      }
    })
  }
});

appModule.controller('ArticleCtrl', function($scope, $stateParams) {
  $scope.id = $stateParams.articleId;
  $scope.type = $stateParams.type;
});

