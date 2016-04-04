mobileresponseWebbApp

    .config(function(snapRemoteProvider) {
        snapRemoteProvider.globalOptions = {
            disable: 'right',
            touchToDrag: true
            // ... others options
        };
    })
    .config(function ($stateProvider, $urlRouterProvider){
        $urlRouterProvider.otherwise("/login");
        $stateProvider
        //------------------------------
        // HOME
        //------------------------------
        .state ('home', {
            url: '/home',
            templateUrl: 'views/home.html',
            onEnter: function($rootScope) {
                $rootScope.createButtonVisible = true;
            },
            onExit: function($rootScope) {
                $rootScope.createButtonVisible = false;
            }
        })

        //------------------------------
        // HEADERS
        //------------------------------
        .state ('headers', {
            url: '/headers',
            templateUrl: 'views/common-2.html'
        })

        //------------------------------
        // LOGIN
        //------------------------------
        .state ('login', {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'loginCtrl as lctrl',
            onEnter: function($rootScope) {
                $rootScope.snapperControl.close();
                $rootScope.snapperControl.disable();
                $rootScope.header = false;
            },
            onExit: function($rootScope) {
                $rootScope.snapperControl.enable();
                $rootScope.header = true;
            }
        })

        //------------------------------
        // PAGES
        //------------------------------
        .state ('pages', {
            url: '/pages',
            templateUrl: 'views/common.html'
        })
        .state ('pages.messages', {
            url: '/messages',
            templateUrl: 'views/messages.html'
        })
            .state ('pages.contacts', {
                url: '/contacts',
                templateUrl: 'views/contacts.html'
            })
            .state ('pages.conversations', {
                url: '/conversations',
                templateUrl: 'views/conversations.html',
                controller: 'conversationsCtrl as conversationsCtrl'
            })
            .state ('conversation', {
                url: '/conversation/:conversationId',
                templateUrl: 'template/conversation.html',
                controller: 'conversationCtrl as conversationCtrl'
            })
    });
