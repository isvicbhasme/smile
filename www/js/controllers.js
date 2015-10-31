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

appModule.controller('LeaveCtrl', function($scope, AuthService) {
  $scope.isLeader = false;
  AuthService.getUserRole().then(function(role) {
    $scope.isLeader = ("leader" == role);
  }, function(msg) {
    console.log(msg);
  });
});

appModule.controller('LeaveApplyCtrl', function($scope, AuthService) {
  var currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  $scope.data = {
    from: currentDate,
    to: currentDate,
    minDate: new Date(2000, 1, 1),
    maxDate: new Date(2100, 12, 31)
  };
   
  $scope.fromDateCallback = function (val) {
      if (!val) { 
        console.log('Date not selected');
      } else {
        console.log('Selected from date is : ', val);
        $scope.data.from = val;
      }
  }
  $scope.toDateCallback = function (val) {
      if (!val) { 
        console.log('Date not selected');
      } else {
        console.log('Selected to date is : ', val);
        $scope.data.to = val;
      }
  }

  var isFormValid = function() {
    var result = { valid: false, message: ""};
    if(!$scope.data.reason || $scope.data.reason.length < 1) {
      result.message = "Oops! Please provide a reason for your leave";
      return result;
    }
    if($scope.data.from.getTime() < currentDate || $scope.data.to.getTime() < currentDate) {
      result.message = "Oops! Sorry you cannot apply leave for a past date";
      return result;
    }
    if($scope.data.from.getTime() > $scope.data.to.getTime()) {
      result.message = "Oh please!, your 'from' date should occur before your 'to' date"
      return result;
    }
    result.valid = true;
    return result;
  }

  $scope.applyLeave = function() {
    var validationResult = isFormValid();
    if(!validationResult.valid)
    {
      alert(validationResult.message);
      return;
    }
    var LeavesTable = Parse.Object.extend("Leave");
    var leaves = new LeavesTable();
    leaves.set("leaveFrom", $scope.data.from);
    leaves.set("leaveTo", $scope.data.to);
    leaves.set("isApproved", false);
    leaves.set("reason", $scope.data.reason);
    leaves.set("userId", Parse.User.current());
    leaves.save(null, {
      success: function(leave) {
        alert("Leave application submitted!")
      },
      error: function(leave, error) {
        alert("Error when trying to submit application: "+error.message);
      }
    });
  }
});

appModule.controller('LeavesViewCtrl', function($scope, AuthService) {
});

appModule.controller('LeavesApproveCtrl', function($scope, AuthService) {
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

  var getRoleFromDb = function(user, callback) {
    var role = '';
    var userObject = Parse.Object.extend("User");
    var query = new Parse.Query(userObject);
    query.include("roleId");
    query.equalTo("objectId", user.id);
    query.find({
      error : function(){
        console.log("Error!");
      }
    }).then(function(results) {
      var roleIdObject = results[0].get("roleId");
      if(role = roleIdObject.get("name"))
        callback(user, role);
    });
  }

  var updateAuth = function(user, role) {
    AuthService.setUserInfo(user, role);
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
      getRoleFromDb(user, updateAuth);
      $state.go('app.articles');
    },function(error) {
      alert("Error: " + error.code + " " + error.message);
      return;
    });
  }
});

appModule.controller('RegisterCtrl', function($scope, $state, AuthService, AuthServiceConstants){
  $scope.registerData = {
    minUsernameLength : AuthServiceConstants.minUsernameLength,
    maxUsernameLength : AuthServiceConstants.maxUsernameLength,
    minPasswordLength : AuthServiceConstants.minPasswordLength,
    maxPasswordLength : AuthServiceConstants.maxPasswordLength
  };

  function isFormValid() {
    var result = { valid: false, message: ""};
    if(!$scope.registerData.username ||
        $scope.registerData.username.length < AuthServiceConstants.minUsernameLength ||
        $scope.registerData.username.length > AuthServiceConstants.maxUsernameLength)
    {
      console.log("Please check your username - "+ $scope.registerData.username);
      result.message = "Please check your username";
      return result;
    }

    if(!$scope.registerData.email || $scope.registerData.email.test)
    {
      result.message = "Please enter a valid email"
      return result;
    }

    if(!$scope.registerData.password ||
        $scope.registerData.password.length < AuthServiceConstants.minPasswordLength ||
        $scope.registerData.password.length > AuthServiceConstants.maxPasswordLength)
    {
      result.message = "Please check your password";
      return result;
    }

    if(!$scope.registerData.confirmPassword ||
        $scope.registerData.password != $scope.registerData.confirmPassword)
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
    var rolesObject = Parse.Object.extend("Roles");
    var query = new Parse.Query(rolesObject);
    query.equalTo("name", "greeter");
    query.find().then(function(results) {
      var user = new Parse.User();
      user.set("username", $scope.registerData.username);
      user.set("email", $scope.registerData.email);
      user.set("password", $scope.registerData.password);
      user.set("roleId", results[0]);
      user.signUp(null, {
        success: function(user) {
          alert("Registration successful! You may login now.")
          $state.go('login');
        },
        error: function(user, error) {
          alert("Oops! " + error.code + " " + error.message);
          return;
        }
      });
    });
  }
});

appModule.controller('ArticleCtrl', function($scope, $stateParams) {
  $scope.id = $stateParams.articleId;
  $scope.type = $stateParams.type;
});

