var servicesModule = angular.module("app.services", []);

servicesModule.factory('AuthService', function(){
  var role = 0;

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
    role = 0;
  }

  var setUserRole = function(roleP) {
    role = roleP;
  }

  /**
   * @return int Returns a bitmap representing the roles of this user.
   * 
   * A combination of the bellow bits shall be returned
   * 0 : Unknown user/role (Either user is not authenticated or does not have a role alloted)
   * 1st bit : Greeter only (1 - AuthServiceConstants.GREETER_BITSET)
   * 2nd bit : Leader only (3 - AuthServiceConstants.LEADER_BITSET)
   * 4th bit : Admin only (7 - AuthServiceConstants.ADMIN_BITSET)
   *
   */
  var getUserRole = function() {
    return new Promise(function(resolve, reject) {
      if(!Parse.User.current() || !Parse.User.current().authenticated) {
        clearUserRole();
        resolve(role);
      }
      else if(role == 0) {
        var userObject = Parse.Object.extend("User");
        var query = new Parse.Query(userObject);
        query.include("roleId");
        query.select("roleId");
        query.equalTo("objectId", Parse.User.current().id);
        query.find({
          error : function(){
            reject("Oops! I could not find your role. Are you an alien?");
          }
        }).then(function(results) {
          if(results[0] != null && results[0].get("roleId").get("name") != "") { // Assuming that all users have a role entry
            role = results[0].get("roleId").get("bitmap");
            resolve(role);
          }
          else
            reject("Oops! Someone slipped & fell");
        });
      }
      else
      {
        resolve(role);
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
          disableBack: true,
          historyRoot: true
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

servicesModule.factory('MenuListService', function(AuthService, AuthServiceConstants) {
  var items = [];
  var getMenuList = function(isAuthenticated) {
    return new Promise(function(resolve, reject) {
      if(isAuthenticated)
      {
        items = [
          {
            name: 'Leaves',
            isLink: true,
            link: '#/app/leaves/apply',
            icon: 'ion-plus-round'
          },
          {
            name: 'Articles',
            isLink: true,
            link: '#/app/articles',
            icon: 'ion-information'
          },
          {
            name: 'Profile',
            isLink: true,
            link: '#/app/profile',
            icon: 'ion-person'
          }
        ];
        AuthService.getUserRole().then(function(role) {
          if(role === AuthServiceConstants.ADMIN_BITSET) {
            items.push({
              name: 'Logout & Exit',
              isLink: false,
              clickAction: 'logout()',
              icon: 'ion-android-exit'
            });
            resolve(items);
          } else {
            resolve(items);
          }
        });
      }
    });
  }

  var getMenuListSize = function() {
    return items.length;
  }

  var clearMenuList = function() {
    items = [];
  }

  return { 
    getMenuList: getMenuList,
    getMenuListSize: getMenuListSize,
    clearMenuList: clearMenuList
  }
});

servicesModule.factory('AuthServiceConstants', function(){
  var minUsernameLength = 3;
  var maxUsernameLength = 10;
  var minPasswordLength = 6;
  var maxPasswordLength = 14;
  var adminBitset       = 7;
  var leaderBitset      = 3;
  var greeterBitset     = 1;

  return {
    minUsernameLength : minUsernameLength,
    maxUsernameLength : maxUsernameLength,
    minPasswordLength : minPasswordLength,
    maxPasswordLength : maxPasswordLength,
    ADMIN_BITSET      : adminBitset,
    LEADER_BITSET     : leaderBitset,
    GREETER_BITSET    : greeterBitset
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

servicesModule.factory('CommonConstService', function(){
  return {
    QUERY_RESULT_LIMIT: 5
  }
});

servicesModule.factory('ConnectivityService', function($rootScope, $cordovaNetwork, $ionicPopup) {

  var alertAndExit = function() {
    $ionicPopup.alert({
      title: 'Internet disconnected',
      template: 'Please connect connect to internet before using this app.'
    }).then(function() {
      if(isOffline()) {
        ionic.Platform.exitApp();
      }
    });
  }
  var isOnline = function(){
    if(ionic.Platform.isWebView()){
      return $cordovaNetwork.isOnline();    
    } else {
      return navigator.onLine;
    }
  }
  var isOffline = function(){
    if(ionic.Platform.isWebView()){
      return !$cordovaNetwork.isOnline();    
    } else {
      return !navigator.onLine;
    }
  }

  return {
    isOnline: isOnline,
    isOffline: isOffline,
    startWatching: function(){
      if(ionic.Platform.isWebView()){

        $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
          console.log("went online");
        });
        $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
          console.log("went offline");
          alertAndExit();
        });

      } else {
        window.addEventListener("online", function(e) {
          console.log("went online");
        }, false);    
        window.addEventListener("offline", function(e) {
          console.log("went offline");
          alertAndExit();
        }, false);  
      }       
    }
  }
});