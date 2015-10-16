var servicesModule = angular.module("app.services", []);

servicesModule.factory('AuthService', function(){
  var isAuthenticated = false;
  var username = '';
  var role = 'GUEST';

  var setUserInfo = function(user) {
    isAuthenticated = user.authenticated();
    console.log("isAuthenticated:"+isAuthenticated);
    username = user.getUsername();
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

  return { 
    setUserInfo: setUserInfo,
    clearUser: clearUser,
    getIsAuthenticated: getIsAuthenticated,
    verifyAuthentication: verifyAuthentication
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
          link: '#/app/leaves'
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