mobileresponseWebbApp

    .config(function ($stateProvider, $urlRouterProvider){
        $urlRouterProvider.otherwise("/login");
        $stateProvider

        //------------------------------
        // HOME
        //------------------------------
        .state ('home', {
            url: '/home',
            templateUrl: 'views/home.html'
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
            controller: 'loginCtrl as lctrl'
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
    });
