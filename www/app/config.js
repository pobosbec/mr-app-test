mobileresponseWebbApp

    .config(function (snapRemoteProvider) {
        snapRemoteProvider.globalOptions = {
            disable: 'right',
            touchToDrag: true
            // ... others options
        };
    })
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/login");
        $stateProvider
            //------------------------------
            // HOME
            //------------------------------
            .state('home', {
                url: '/home',
                templateUrl: 'views/home.html',
                onEnter: function ($rootScope) {
                    $rootScope.createButtonVisible = true;
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                },
                onExit: function ($rootScope) {
                    $rootScope.createButtonVisible = false;
                }
            })

            //------------------------------
            // EDIT PROFILE
            //------------------------------
            .state('profile', {
                url: '/profile',
                templateUrl: 'views/edit-profile.html',
                controller: 'editProfileCtrl as profileCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                }
            })

            //------------------------------
            // SETTINGS
            //------------------------------
            .state('settings', {
                url: '/settings',
                templateUrl: 'views/settings.html',
                controller: 'settingsCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                }
            })

            //------------------------------
            // HEADERS
            //------------------------------
            .state('headers', {
                url: '/headers',
                templateUrl: 'views/common-2.html'
            })

            //------------------------------
            // LOGIN
            //------------------------------
            .state('login', {
                url: '/login',
                templateUrl: 'views/login.html',
                controller: 'loginCtrl as lctrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.snapperControl.disable();
                    $rootScope.header = false;
                },
                onExit: function ($rootScope) {
                    $rootScope.snapperControl.enable();
                    $rootScope.header = true;
                }
            })

            //------------------------------
            // PAGES
            //------------------------------
            .state('pages', {
                url: '/pages',
                templateUrl: 'views/common.html',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                }
            })
            .state('pages.messages', {
                url: '/messages',
                templateUrl: 'views/messages.html',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                },
                onExit: function ($rootScope) {
                    $rootScope.header = true;
                }
            })
            .state('pages.contacts', {
                url: '/contacts',
                templateUrl: 'views/contacts.html',
                controller: 'contactsCtrl as contactsCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                },
                onExit: function ($rootScope) {
                    $rootScope.header = true;
                }
            })
            .state('pages.conversations', {
                url: '/conversations',
                templateUrl: 'views/conversations.html',
                controller: 'conversationsCtrl as conversationsCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.createButtonVisible = true;
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                },
                onExit: function ($rootScope) {
                    $rootScope.createButtonVisible = false;
                }
            })
            .state('conversation', {
                url: '/conversation/:conversationId',
                templateUrl: 'template/conversation.html',
                controller: 'conversationCtrl as conversationCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = false;
                },
                onExit: function ($rootScope) {
                    $rootScope.header = true;
                }
            });
    });
