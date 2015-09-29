var appModule = angular.module('starter.controllers', []);

appModule.factory('AuthService', function(){
  var isAuthenticated = false;
  var username = '';
  var role = 'GUEST';

  var setUserInfo = function(user) {
    isAuthenticated = user.authenticated();
    username = user.getUsername();
  }

  var clearUser = function() {
    isAuthenticated = false;
    username = '';
  }

  return { 
    setUserInfo: setUserInfo,
    clearUser: clearUser,
    isAuthenticated: isAuthenticated
    };
});

appModule.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, AuthService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  // $scope.$on('$ionicView.enter', function(e) {
  // });
  $scope.userAuthenticated = AuthService.isAuthenticated;
  console.log("Entering ionic view, isAuthenticated:"+$scope.userAuthenticated);

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.showlogin = function() {
    $scope.modal.show();
  };

  $scope.logout = function() {
    Parse.User.logOut().then(
      function(){
      AuthService.clearUser();
    }, function(error) {
        alert("Error: " + error.code + " " + error.message);
    });
  }

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    Parse.User.logIn($scope.loginData.username, $scope.loginData.password)
    .then(function(user) {
      console.log(user);
      AuthService.setUserInfo(user);
      $scope.modal.hide();
      $state.go('app.articles');
    },function(error) {
      alert("Error: " + error.code + " " + error.message);
      $tate.go()
    });
  };

  $scope.showRegistration = function() {
    $scope.modal.hide();
    $state.go('app.register');
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

