var servicesModule = angular.module("app.services", []);

servicesModule.factory('AuthService', function(){
  var role = '';

  var isAuthenticated = function() {
    return Parse.User.current() && Parse.User.current().authenticated();
  }

  var getUsername = function() {
    var user = Parse.User.current();
    if(user)
      return user.getUsername();
    return null;
  }

  var clearUserRole = function() {
    role = '';
  }

  var setUserRole = function(roleP) {
    role = roleP;
  }

  var getUserRole = function() {
    return new Promise(function(resolve, reject) {
      if(!Parse.User.current() || !Parse.User.current().authenticated) {
        clearUserRole();
        resolve(role);
      }
      else if(role == "") {
        var userObject = Parse.Object.extend("User");
        var query = new Parse.Query(userObject);
        query.include("roleId");
        query.equalTo("objectId", Parse.User.current().id);
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
      else
      {
        resolve(role.trim().toLowerCase());
      }
    });
  }

  return { 
    clearUserRole: clearUserRole,
    isAuthenticated: isAuthenticated,
    setUserRole: setUserRole,
    getUserRole: getUserRole,
    getUsername: getUsername
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

servicesModule.factory('BasicApiService', function() {
  var isSameDate = function(date1, date2) {
    return  date1.getDate() == date2.getDate() &&
            date1.getMonth() == date2.getMonth() &&
            date1.getFullYear() == date2.getFullYear();
  }

  return {
    isSameDate: isSameDate
  }
});