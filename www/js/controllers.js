'use strict';
var appModule = angular.module('app.controllers', ['app.services']);

appModule.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AuthServiceConstants, MenuListService, HistoryService, BasicApiService) {

  var isLoggedIn = AuthService.isAuthenticated();
  if(!isLoggedIn) {
    HistoryService.clearAllAndDontStoreThisPage();
    console.log("redirect to login");
    $state.go('login');
    return;
  }

  $scope.$on("$ionicView.afterEnter", function(){
    if(isLoggedIn && MenuListService.getMenuListSize() == 0) {
      $scope.menuItems = {}
      MenuListService.getMenuList(isLoggedIn).then(function(items) {
        $scope.menuItems = items;
        $scope.$apply();
      });
    }
  });

  $scope.logout = function() {
    Parse.User.logOut().then(
      function(){
      HistoryService.clearAllAndDontStoreThisPage();
      AuthService.clearUserRole();
      ionic.Platform.exitApp();
    }, function(error) {
        $ionicPopup.alert({
          title: "User State",
          template: "Error: " + error.message
        });
    });
  }
});

appModule.controller('ArticlesCtrl', function($scope, $state, AuthService) {
  if(!AuthService.isAuthenticated()) {
    $state.go('login');
    return;
  }
  $scope.articles = [
    { title: 'Report - 1st Jan 2015', id: 1, type: 'Announcement' },
    { title: 'Report - 2nd Jan 2015', id: 2, type: 'Article' },
    { title: 'Report - 3rd Jan 2015', id: 3, type: 'Announcement' },
    { title: 'Report - 4th Jan 2015', id: 4, type: 'Event' },
    { title: 'Report - 5th Jan 2015', id: 5, type: 'Article' },
    { title: 'Report - 6th Jan 2015', id: 6, type: 'Announcement' }
  ];
});

appModule.controller('LeaveCtrl', function($scope, AuthService, AuthServiceConstants) {
  $scope.isLeader = false;
  AuthService.getUserRole().then(function(role) {
    $scope.isLeader = (role >= AuthServiceConstants.LEADER_BITSET);
    $scope.$apply();
  }, function(msg) {
    console.log(msg);
  });
});

appModule.controller('LeaveApplyCtrl', function($scope, $state, AuthService, $ionicPopup) {
  if(!AuthService.isAuthenticated()) {
    $state.go('login');
    return;
  }
  var currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  $scope.data = {
    from: currentDate,
    to: currentDate,
    rangeSelection: false,
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
    if($scope.data.rangeSelection) {
      $scope.data.to = $scope.data.from;
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

  $scope.applyLeave = function(form) {
    var validationResult = isFormValid();
    if(!validationResult.valid)
    {
      $ionicPopup.alert({
        title: 'Form Validation Error',
        template: validationResult.message
      });
      return;
    }
    var LeavesTable = Parse.Object.extend("Leave");
    var leaves = new LeavesTable();
    leaves.set("leaveFrom", $scope.data.from);
    leaves.set("leaveTo", $scope.data.to);
    leaves.set("isApproved", false);
    leaves.set("isRejected", false);
    leaves.set("isRevoked", false);
    leaves.set("reason", $scope.data.reason);
    leaves.set("userId", Parse.User.current());
    leaves.save(null, {
      success: function(leave) {
        $ionicPopup.alert({
          title: "Leave Application",
          template: "Leave application submitted!"
        });
        $scope.data.reason = "";
        form.$setPristine();
        form.$setUntouched();
        $state.go("app.leaves.view", {}, {reload: true}); // reload option will force the view to refresh to pull latest data
      },
      error: function(leave, error) {
        $ionicPopup.alert({
          title: "Leave Application",
          template: "Error when trying to submit application: "+error.message
        });
      }
    });
  }
});

appModule.controller('LeavesViewCtrl', function($scope, $state, AuthService, BasicApiService, $ionicPopup, $rootScope, CommonConstService) {
  if(!AuthService.isAuthenticated()) {
    $state.go('login');
    return;
  }

  var leavesCount = 0;
  var leavesQuery = new Parse.Query(Parse.Object.extend("Leave"));
  leavesQuery.include("inspectedBy.profileId");
  leavesQuery.limit(CommonConstService.QUERY_RESULT_LIMIT);
  leavesQuery.ascending("createdAt");
  leavesQuery.equalTo("userId", Parse.User.current());

  var refresh = function() {
    $scope.leaves.list = [];
    leavesQuery.skip(0);
    resetAndRunQuery().then(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  var revokeLeave = function(leave) {
    var leaveQuery = new Parse.Query(Parse.Object.extend("Leave"));
    leaveQuery.equalTo("objectId", leave.id);
    leaveQuery.first().then(function(result) {
      if(result)
      {
        var currentDate = new Date();
        result.set("isRevoked", true);
        result.set("revokedOn", currentDate);
        result.save().then(function() {
          for (var i = $scope.leaves.list.length - 1; i >= 0; i--) {
            if($scope.leaves.list[i].id == leave.id) {
              $scope.leaves.list[i].isRevoked = true;
              $scope.leaves.list[i].revokedOn = currentDate;
              $scope.$apply();
              break;
            }
          };
        });
      }
    });
  }

  var confirmLeaveRevoke = function(leave) {
    $ionicPopup.confirm({
      title: 'Revoke leave',
      template: 'Are you sure you want to revoke this leave?'
    }).then(function(response) {
      if(response) {
        revokeLeave(leave);
      }
    });
  }

  $scope.leaves = {
    list: [],
    initialized: false,
    moreItemsAvailable: false,
    confirmRevoke: confirmLeaveRevoke,
    refresh: refresh
  };

  $scope.loadMore = function() {
    if($scope.leaves.initialized) {
      var displayedLeavesCount = $scope.leaves.list.length;
      leavesQuery.skip(displayedLeavesCount);
      if(displayedLeavesCount < leavesCount) {
        runQuery().then(function() {
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      } else {
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $scope.leaves.moreItemsAvailable = false;
      }
    }
  };

  var runQuery = function() {
    return new Promise(function(resolve, reject) {
      leavesQuery.find().then(function(results) {
        $scope.leaves.count = results.length;
        results.forEach(function(dbData, index) {
          var leave = {};
          leave.id = dbData.id;
          leave.createdOn = dbData.get("createdAt");
          leave.reason = dbData.get("reason");
          leave.from = dbData.get("leaveFrom");
          if(!BasicApiService.isSameDate(dbData.get("leaveFrom"), dbData.get("leaveTo"))) {
            leave.to = dbData.get("leaveTo");
          }
          leave.isRejected = dbData.get("isRejected");
          leave.isRevoked = dbData.get("isRevoked");
          if(leave.isRevoked)
          {
            leave.revokedOn = dbData.get("revokedOn");
          }
          leave.isApproved = dbData.get("isApproved");
          if(leave.isApproved || leave.isRejected) {
            var inspector = "";
            if(dbData.get("inspectedBy").get("profileId") != null) {
              if(dbData.get("inspectedBy").get("profileId").get("firstName") != null) {
                inspector = dbData.get("inspectedBy").get("profileId").get("firstName");
              }
              if(dbData.get("inspectedBy").get("profileId").get("lastName") != null) {
                inspector = inspector + " " + dbData.get("inspectedBy").get("profileId").get("lastName");
              }
              leave.inspectedBy = inspector.trim();
            }
            if(inspector.length == 0) {
              leave.inspectedBy = dbData.get("inspectedBy").get("username");
            }
            leave.inspectedOn = dbData.get("inspectedOn");
          }
          $scope.leaves.list.push(leave);
        });
        resolve();
      });
    });
  }

  var resetAndRunQuery = function() {
    return new Promise(function(resolve, reject) {
      leavesQuery.count().then(function(count) {
        leavesCount = count;
        if($scope.leaves.list.length < leavesCount) {
          $scope.leaves.moreItemsAvailable = true;
          runQuery().then(function() {
            $scope.leaves.initialized = true;
            $scope.$apply();
            resolve();
          });
        } else {
          $scope.leaves.initialized = true;
          $scope.leaves.moreItemsAvailable = false;
          $scope.$apply();
        }
      });
    });
  }

  resetAndRunQuery();
});

appModule.controller('LeavesApproveCtrl', function($scope, $ionicModal, $ionicPopup, AuthService, BasicApiService, CommonConstService) {
  if(!AuthService.isAuthenticated()) {
    $state.go('login');
    return;
  }

  var currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  var leavesQuery = new Parse.Query(Parse.Object.extend("Leave"));
  leavesQuery.include("inspectedBy.profileId");
  leavesQuery.include("userId.profileId");
  leavesQuery.ascending("createdAt");
  leavesQuery.notEqualTo("userId", Parse.User.current());
  leavesQuery.limit(CommonConstService.QUERY_RESULT_LIMIT);
  var queryResults = [];
  var leavesCount = 0;

  var confirmAndApprove = function(leave){
    $ionicPopup.confirm({
      title: 'Approve leave',
      template: 'Are you sure you want to approve this leave?'
    }).then(function(response) {
      if(response) {
        for(var i=0; i<queryResults.length; ++i) {
          if(queryResults[i].id == leave.id) {
            queryResults[i].set("isApproved", true);
            queryResults[i].set("isRejected", false);
            queryResults[i].set("inspectedBy", Parse.User.current());
            queryResults[i].set("inspectedOn", currentDate);
            queryResults[i].save().then(function() {
              leave.isApproved = true;
              leave.isRejected = false;
              leave.inspectedBy = Parse.User.current().getUsername();
              leave.inspectedOn = currentDate;
              $scope.$apply();
            });
            return;
          }
        }
      }
    });
  }

  var confirmAndReject = function(leave){
    $ionicPopup.confirm({
      title: 'Reject leave',
      template: 'Are you sure you want to reject this leave?'
    }).then(function(response) {
      if(response) {
        for(var i=0; i<queryResults.length; ++i) {
          if(queryResults[i].id == leave.id) {
            queryResults[i].set("isApproved", false);
            queryResults[i].set("isRejected", true);
            queryResults[i].set("inspectedBy", Parse.User.current());
            queryResults[i].set("inspectedOn", currentDate);
            queryResults[i].save().then(function() {
              leave.isApproved = false;
              leave.isRejected = true;
              leave.inspectedBy = Parse.User.current().getUsername();
              leave.inspectedOn = currentDate;
              $scope.$apply();
            });
            return;
          }
        }
      }
    });
  }

  var refresh = function() {
    $scope.filteredLeaves.list = [];
    resetAndRunQuery().then(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  $scope.filteredLeaves = {
    list: [],
    approve: confirmAndApprove,
    reject: confirmAndReject,
    refresh: refresh,
    moreItemsAvailable: false,
    isInitialized: false
  };

  var queryParams = {
    from: currentDate,
    to: null
  }

  $scope.filterParams = {
    from: null,
    to: null
  }

  $scope.filterParams.fromDateCallback = function (val) {
      if (val) { 
        $scope.filterParams.from = val;
      }
  }
  $scope.filterParams.toDateCallback = function (val) {
      if (val) { 
        $scope.filterParams.to = val;
      }
  }

  var applyQueryParamsToParseQuery = function() {
    leavesQuery.greaterThanOrEqualTo("leaveFrom", queryParams.from);
    if(queryParams.to != null) {
      leavesQuery.lessThanOrEqualTo("leaveTo", queryParams.to);
    }
  }

  var runQuery = function() {
    return new Promise(function(resolve, reject) {
      applyQueryParamsToParseQuery();
      leavesQuery.find().then(function(results) {
        results.forEach(function(dbData, index) {
          var leave = {};
          leave.id = dbData.id;
          leave.createdOn = dbData.get("createdAt");
          leave.reason = dbData.get("reason");
          leave.from = dbData.get("leaveFrom");
          if(!BasicApiService.isSameDate(dbData.get("leaveFrom"), dbData.get("leaveTo"))) {
            leave.to = dbData.get("leaveTo");
          }
          if(queryParams.to == null || dbData.get("leaveTo").getTime() > queryParams.to.getTime()) {
            queryParams.to = dbData.get("leaveTo");
          }
          var applicant = "";
          if(dbData.get("userId").get("profileId") != null) {
            if(dbData.get("userId").get("profileId").get("firstName") != null) {
              leave.applicant = dbData.get("userId").get("profileId").get("firstName");
            }
            if(dbData.get("userId").get("profileId").get("lastName") != null) {
              leave.applicant = leave.applicant + " " + dbData.get("userId").get("profileId").get("lastName");
            }
          }
          if(leave.applicant.trim().length == 0) {
            leave.applicant = dbData.get("userId").get("username");
          }
          leave.isRejected = dbData.get("isRejected");
          leave.isRevoked = dbData.get("isRevoked");
          if(leave.isRevoked)
          {
            leave.revokedOn = dbData.get("revokedOn");
          }
          leave.isApproved = dbData.get("isApproved");
          if(leave.isApproved || leave.isRejected) {
            var inspector = "";
            if(dbData.get("inspectedBy").get("profileId") != null) {
              if(dbData.get("inspectedBy").get("profileId").get("firstName") != null) {
                inspector = dbData.get("inspectedBy").get("profileId").get("firstName");
              }
              if(dbData.get("inspectedBy").get("profileId").get("lastName") != null) {
                inspector = inspector + " " + dbData.get("inspectedBy").get("profileId").get("lastName");
              }
              leave.inspectedBy = inspector.trim();
            }
            if(inspector.length == 0) {
              leave.inspectedBy = dbData.get("inspectedBy").get("username");
            }
            leave.inspectedOn = dbData.get("inspectedOn");
          }
          $scope.filteredLeaves.list.push(leave);
        });
        queryResults = results;
        resolve();
      });
    });
  }

  var validateFilters = function() {
    var result = { valid: false, message: ""};
    if($scope.filterParams.from == null ||
       $scope.filterParams.to == null ||
       $scope.filterParams.from > $scope.filterParams.to) {
      result.message = "'From' date should occur before 'to' date.";
      return result;
    }
    result.valid = true;
    return result;
  }

  $ionicModal.fromTemplateUrl('templates/leaveApproveFilters.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.showFilters = function() {
    $scope.filterParams.from = queryParams.from;
    if(queryParams.to == null) {
      $scope.filterParams.to = queryParams.from;
    } else {
      $scope.filterParams.to = queryParams.to;
    }
    $scope.modal.show()
  }

  $scope.cancelFilters = function() {
    $scope.modal.hide();
  }

  $scope.applyFilters = function() {
    var validationResult = validateFilters();
    if(!validationResult.valid)
    {
      $ionicPopup.alert({
        title: "Form Validation",
        template: "Oops! "+validationResult.message
      });
    }
    else {
      if( !BasicApiService.isSameDate(queryParams.from, $scope.filterParams.from)
        || !BasicApiService.isSameDate(queryParams.to, $scope.filterParams.to)) {
        $scope.filteredLeaves.list = [];
        queryParams.from = $scope.filterParams.from;
        queryParams.to = $scope.filterParams.to;
        $scope.filteredLeaves.isInitialized = false;
        $scope.filteredLeaves.moreItemsAvailable = false;
        resetAndRunQuery();
      }
      $scope.modal.hide();
    }
  }

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

  $scope.loadMore = function() {
    if($scope.filteredLeaves.isInitialized) {
      var displayedLeavesCount = $scope.filteredLeaves.list.length;
      leavesQuery.skip(displayedLeavesCount);
      if(displayedLeavesCount < leavesCount) {
        runQuery().then(function() {
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      } else {
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $scope.filteredLeaves.moreItemsAvailable = false;
      }
    }
  };

  var resetAndRunQuery = function() {
    return new Promise(function(resolve, reject){
      applyQueryParamsToParseQuery();
      leavesQuery.skip(0);
      leavesQuery.count().then(function(count) {
        leavesCount = count;
        if(leavesCount > 0) {
          $scope.filteredLeaves.moreItemsAvailable = true;
          runQuery().then(function() {
            $scope.filteredLeaves.isInitialized = true;
            $scope.$apply();
            resolve();
          });
        } else {
          $scope.filteredLeaves.isInitialized = true;
          $scope.filteredLeaves.moreItemsAvailable = false;
          $scope.$apply();
        }
      });
    });
  }

  resetAndRunQuery();
});

appModule.controller('LoginCtrl', function($scope, $state, $ionicPopup, $ionicModal, AuthService, AuthServiceConstants, MenuListService, HistoryService){
  $scope.loginData = {
    username: '',
    minUsernameLength : AuthServiceConstants.minUsernameLength,
    maxUsernameLength : AuthServiceConstants.maxUsernameLength,
    minPasswordLength : AuthServiceConstants.minPasswordLength,
    maxPasswordLength : AuthServiceConstants.maxPasswordLength
  };

  $scope.forgotPwd = {
    email: ''
  }

  var isLoggedIn = AuthService.isAuthenticated();
  if(isLoggedIn) {
    HistoryService.clearAllAndDontStoreThisPage();
    $state.go('app.profile');
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
    var userObject = Parse.Object.extend("User");
    var query = new Parse.Query(userObject);
    query.include("roleId");
    query.select("roleId");
    query.equalTo("objectId", user.id);
    query.find({
      error : function(){
        console.log("Error!");
      }
    }).then(function(results) {
      var roleIdObject = results[0].get("roleId");
      if(roleIdObject.get("name") && roleIdObject.get("bitmap"))
        callback(roleIdObject.get("bitmap"));
    });
  }

  $ionicModal.fromTemplateUrl('templates/forgotpassword.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.showPwdResetModal = function() {
    $scope.modal.show()
  }

  $scope.cancelPwdRequest = function() {
    $scope.modal.hide();
  }

  $scope.requestPwdReset = function() {
    if($scope.forgotPwd.email == null || $scope.forgotPwd.email.trim().length == 0) {
      $ionicPopup.alert({
        title: "Form Validation",
        template: "Please enter a valid email address."
      });
      return;
    }
      Parse.User.requestPasswordReset($scope.forgotPwd.email, {
      success: function() {
        $ionicPopup.alert({
          title: "Password reset",
          template: "Please check your email for password reset procedure."
        });
      },
      error: function(error) {
        $ionicPopup.alert({
          title: "Form Validation",
          template: "Error: "+error.message
        });
      }
    });
    $scope.modal.hide();
  }

  $scope.doLogin = function() {
    var validationResult = isFormValid();
    if(!validationResult.valid)
    {
      $ionicPopup.alert({
        title: "Form Validation",
        template: "Oops! "+validationResult.message
      });
      return;
    }
    Parse.User.logIn($scope.loginData.username, $scope.loginData.password)
    .then(function(user) {
      HistoryService.clearAllAndDontStoreThisPage();
      AuthService.clearUserRole();
      MenuListService.clearMenuList();
      $state.go('app.profile');
    },function(error) {
      $ionicPopup.alert({
        title: "Login Failure",
        template: "Error: " + error.message
      });
      return;
    });
  }
});

appModule.controller('RegisterCtrl', function($scope, $state, $ionicPopup, AuthService, AuthServiceConstants){
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
      $ionicPopup.alert({
        title: "Form Validation",
        template: "Oops! "+validationResult.message
      });
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
          $ionicPopup.alert({
            title: "User Registration",
            template: "Registration successful! You may login now."
          });
          $state.go('login');
        },
        error: function(user, error) {
          $ionicPopup.alert({
            title: "User Registration",
            template: "Oops! " + error.message
          });
          return false;
        }
      });
    });
  }
});

appModule.controller('ArticleCtrl', function($scope, $stateParams, $state, AuthService) {
  if(!AuthService.isAuthenticated()) {
    $state.go('login');
    return;
  }
  $scope.id = $stateParams.articleId;
  $scope.type = $stateParams.type;
});

appModule.controller('ProfileCtrl', function($scope, AuthService, AuthServiceConstants, $state, $ionicPopup){
  if(!AuthService.isAuthenticated()) {
    $state.go('login');
    return;
  }

  var userProfile = null;

  $scope.saveFirstName = function() {
    if(userProfile.get("firstName") != $scope.profile.firstName) {
      userProfile.set("firstName", $scope.profile.firstName);
      userProfile.save();
    }
    $scope.editable.firstName = false;
  }

  $scope.saveLastName = function() {
    if(userProfile.get("lastName") != $scope.profile.lastName) {
      userProfile.set("lastName", $scope.profile.lastName);
      userProfile.save();
    }
    $scope.editable.lastName = false;
  }

  $scope.saveMobileNumber = function() {
    if(userProfile.get("mobileNumber") != $scope.profile.mobileNumber) {
      userProfile.set("mobileNumber", $scope.profile.mobileNumber);
      userProfile.save();
    }
    $scope.editable.mobileNumber = false;
  }

  $scope.saveEmail = function() {
    Parse.User.current().fetch({
      success: function(user) {
        if(user.getEmail() != $scope.profile.email) {
          user.setEmail($scope.profile.email);
          user.save();
        }
      }
    });
    $scope.editable.email = false;
  }

  $scope.savePassword = function() {
    if($scope.profile.newPwd.length <= AuthServiceConstants.minPasswordLength ||
      $scope.profile.newPwd.length >= AuthServiceConstants.maxPasswordLength) {
      $ionicPopup.alert({
        title: "Password update failed",
        template: "Your new password should be "+AuthServiceConstants.minPasswordLength+" to "+AuthServiceConstants.maxPasswordLength+" chars long."
      });
      return;
    }
    if($scope.profile.newPwd !== $scope.profile.confPwd) {
      $ionicPopup.alert({
        title: "Password update failed",
        template: "Your new passwords do not match."
      });
      return;
    }
    Parse.User.logIn(Parse.User.current().getUsername(), // Validate user's old password. (Old time's sake!)
      $scope.profile.oldPwd,{
      success: function() {
        var user = Parse.User.current();
        var username = Parse.User.current().getUsername();
        var newPassword = $scope.profile.newPwd;
        user.setPassword(newPassword);
        user.save({                 // Save user's new password
          success: function() {
            Parse.User.logOut();
            Parse.User.logIn(username, newPassword, {   // Relogin with new password (Refreshes session token!)
              success: function() {
                $ionicPopup.alert({
                  title: "Password update successful",
                  template: "Your password was updated successfully."
                });
                resetPasswordVarsInScope();
              },
              error: function(error) {
                $ionicPopup.alert({
                title: "Password update failed",
                template: "Error "+error.code+": "+error.message+".\n Please report to admin and buy him a pack of tissues. Because he will shed tears when he hears this."
              });
              }
            });
          },
          error: function(error) {
            $ionicPopup.alert({
              title: "Password update failed",
              template: "Error "+error.code+": "+error.message+".\n Please report to admin."
            });
          return;
          }
        });
      },
      error: function(error) {
        $ionicPopup.alert({
          title: "Password update failed",
          template: "Error: " + error.code + " " + error.message
        });
        return;
      }
    });
  }

  $scope.saveGender = function() {
    if(userProfile.get("isFemale") != $scope.profile.isFemale) {
      userProfile.set("isFemale", $scope.profile.isFemale);
      userProfile.save();
    }
  }

  var resetPasswordVarsInScope = function() {
    $scope.profile.oldPwd = "";
    $scope.profile.newPwd = "";
    $scope.profile.confPwd = "";
    $scope.$apply();
  }

  $scope.profile = {
    firstName: "",
    lastName: "",
    mobileNumber: "",
    isFemale: false,
    oldPwd: "",
    newPwd: "",
    confPwd: "",
    minPasswordLength: AuthServiceConstants.minPasswordLength,
    maxPasswordLength: AuthServiceConstants.maxPasswordLength
  }

  $scope.editable = {
    firstName: false,
    lastName: false,
    mobileNumber: false
  }
  
  var runQuery = function() {
    return new Promise(function(resolve, reject) {
      if(Parse.User.current().get("profileId") == null) {
        reject();
      }
      else {
        var profile = Parse.Object.extend("Profile");
        profile.id = Parse.User.current().get("profileId");
        var profileQuery = new Parse.Query(Parse.Object.extend("Profile"));
        profileQuery.equalTo("objectId", profile);
        profileQuery.find().then(function(results) {
          if(results.length > 0) {
            $scope.profile.firstName = results[0].get("firstName");
            $scope.profile.lastName = results[0].get("lastName");
            $scope.profile.mobileNumber = results[0].get("mobileNumber");
            $scope.profile.isFemale = results[0].get("isFemale");
            $scope.profile.birthdate = results[0].get("birthdate");
            userProfile = results[0];
            resolve();
          } else {
            reject();
          }
        }, function() {
          reject();
        });
      }
    });
  }

  Parse.User.current().fetch().then(function(user) {
    $scope.profile.email = user.getEmail();
    runQuery().then(function() {
      $scope.$apply();
    }, function() {
      if(userProfile == null) {
        var Profile = new Parse.Object.extend("Profile");
        userProfile = new Profile();
        Parse.User.current().set("profileId", userProfile).save();
        $scope.$apply();
      }
    });
  });
});