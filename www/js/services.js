var servicesModule = angular.module("app.services", []);

servicesModule.factory('AuthService', function(){
  var isAuthenticated = false;
  var username = '';
  var role = '';

  var setUserInfo = function(user, rolePar) {
    isAuthenticated = user.authenticated();
    if(isAuthenticated)
    {
      console.log("isAuthenticated:"+isAuthenticated);
      username = user.getUsername();
      role = rolePar;
      console.log("role:"+role);
    }
  }

  var clearUser = function() {
    isAuthenticated = false;
    username = '';
  }

  var getIsAuthenticated = function() {
    console.log("AuthService.isAuthenticated:"+isAuthenticated);
    return isAuthenticated;
  }

  var verifyAuthentication = function() {
    var user = Parse.User.current();
    if(user) {
      isAuthenticated = user.authenticated();
      username = user.getUsername();
    }
    else
    {
      isAuthenticated = false;
      username = '';
    }
  }

  var getUserRole = function() {
    return new Promise(function(resolve, reject) {
      console.log("Promise");
      if(role == "" && Parse.User.current) {
        var userObject = Parse.Object.extend("User");
        var query = new Parse.Query(userObject);
        query.include("roleId");
        query.equalTo("objectId", Parse.User.current.id);
        query.find({
          error : function(){
            reject("Oops! I could not find your role. Are you an alien?");
          }
        }).then(function(results) {
          if(results[0] != null && (role = results[0].get("roleId").get("name")) != "") // Assuming that all users have a role entry
            resolve(role.trim().toLowerCase());
          else
            reject("Oops! Someone slipped & fell");
        });
      }
      else if(role != "")
      {
        resolve(role.trim().toLowerCase());
      }
      else
      {
        reject("Oops! You should not be here"); // Tried to retrieve role of an unknown user!
      }
    });
  }

  return { 
    setUserInfo: setUserInfo,
    clearUser: clearUser,
    getIsAuthenticated: getIsAuthenticated,
    verifyAuthentication: verifyAuthentication,
    getUserRole: getUserRole
  };
});

servicesModule.factory('HistoryService', function($ionicHistory){
  var dontStoreThisPage = function() {
    $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true
      });
  }

  var clearAll = function() {
    $ionicHistory.clearHistory();
  }

  var clearAllAndDontStoreThisPage = function() {
    $ionicHistory.clearHistory();
    dontStoreThisPage();
  }

  return {
    dontStoreThisPage: dontStoreThisPage,
    clearAll: clearAll,
    clearAllAndDontStoreThisPage: clearAllAndDontStoreThisPage
  };
});

servicesModule.factory('MenuListService', function() {
  var getMenuList = function(isAuthenticated) {
    var items = [];
    if(isAuthenticated)
    {
      items = [
        {
          name: 'Logout',
          isLink: false,
          clickAction: 'logout()'
        },
        {
          name: 'Leaves',
          isLink: true,
          link: '#/app/leaves/apply'
        },
        {
          name: 'Articles',
          isLink: true,
          link: '#/app/articles'
        }
      ];
    }
    console.log("Factory invoked");
    return items;
  }

  return { getMenuList: getMenuList }
});

servicesModule.factory('AuthServiceConstants', function(){
  var minUsernameLength = 3;
  var maxUsernameLength = 10;
  var minPasswordLength = 6;
  var maxPasswordLength = 14;

  return {
    minUsernameLength : minUsernameLength,
    maxUsernameLength : maxUsernameLength,
    minPasswordLength : minPasswordLength,
    maxPasswordLength : maxPasswordLength
  }
});