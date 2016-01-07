// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('app', ['ionic', 'app.controllers', 'ngMessages', 'ionic-datepicker', 'ngCordova'])

.run(function($ionicPlatform, ConnectivityService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
  if (window.cordova && window.cordova.plugins.Keyboard) {
    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    cordova.plugins.Keyboard.disableScroll(true);

  }
  if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  ConnectivityService.startWatching();
  console.log("Online state: "+ConnectivityService.isOnline());
  });
  Parse.initialize("RAxSwXAaCAnU0gDMerYZyzlVUYG1XJPTjnf1SxkT", "i3LCpXVDwWIgUlqcEBdrncGQeBKuT9HG9lWuDrK4");
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  

  $stateProvider
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.leaves', {
    url: '/leaves',
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: 'templates/leaves.html',
        controller: 'LeaveCtrl'
      }
    }
  })

  .state('app.leaves.apply', {
    url: '/apply',
    views: {
      'applyLeaveTab': {
        templateUrl: 'templates/applyleave.html',
        controller: 'LeaveApplyCtrl'
      }
    }
  })

  .state('app.leaves.view', {
    url: '/view',
    views: {
      'viewLeavesTab': {
        templateUrl: 'templates/viewleaves.html',
        controller: 'LeavesViewCtrl'
      }
    }
  })

  .state('app.leaves.approve', {
    url: '/approve',
    views: {
      'approveLeavesTab': {
        templateUrl: 'templates/approveleaves.html',
        controller: 'LeavesApproveCtrl'
      }
    }
  })

  .state('app.articles', {
    url: '/articles',
    views: {
      'menuContent': {
        templateUrl: 'templates/articles.html',
        controller: 'ArticlesCtrl'
      }
    }
  })

  .state('app.article', {
    url: '/article/:articleId?type',
    views: {
      'menuContent': {
        templateUrl: 'templates/article.html',
        controller: 'ArticleCtrl'
      }
    }
  })

  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent': {
        templateUrl: 'templates/profile.html',
        controller: 'ProfileCtrl'
      }
    }
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  .state('register', {
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  $ionicConfigProvider.tabs.position('bottom');
});
