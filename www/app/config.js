mobileresponseWebbApp

    .config(function ($stateProvider, $urlRouterProvider){
        $urlRouterProvider.otherwise("/home");


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


    });
