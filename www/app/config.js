mobileresponseWebbApp
    .config(function (snapRemoteProvider) {
        snapRemoteProvider.globalOptions = {
            disable: 'right',
            touchToDrag: true
            // ... others options
        };
    })
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/home");
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
                // controller: 'conversationsCtrl as conversationsCtrl',
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
                //controller: 'conversationCtrl as conversationCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = false;
                },
                onExit: function ($rootScope) {
                    $rootScope.header = true;
                }
            })
            .state('pages.debug', {
                url: '/debug/',
                templateUrl: 'views/debug-view.html',
                controller: 'debugCtrl as debugCtrl',
                onEnter: function ($rootScope) {
                    $rootScope.snapperControl.close();
                    $rootScope.header = true;
                },
                onExit: function ($rootScope) {
                    $rootScope.createButtonVisible = false;
                }
            });;

    })
    .config(['$compileProvider', function ($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
    }])
    .config(['$provide', function ($provide) {
        $provide.decorator('$log', ['$delegate', 'Logging', function ($delegate, Logging) {
            Logging.enabled = true;
            var methods = {
                error: function () {
                    if (Logging.enabled) {
                        $delegate.error.apply($delegate, arguments);
                        Logging.error.apply(null, arguments);
                    }
                },
                log: function () {
                    if (Logging.enabled) {
                        $delegate.log.apply($delegate, arguments);
                        Logging.log.apply(null, arguments);
                    }
                },
                info: function () {
                    if (Logging.enabled) {
                        $delegate.info.apply($delegate, arguments);
                        Logging.info.apply(null, arguments);
                    }
                },
                warn: function () {
                    if (Logging.enabled) {
                        $delegate.warn.apply($delegate, arguments);
                        Logging.warn.apply(null, arguments);
                    }
                }
            };
            return methods;
        }]);
    }])
    .service('Logging', function ($injector) {

        var customLogService;
        
        var service = {
            error: function () {
                self.type = 'error';
                log.apply(self, arguments);
            },
            warn: function () {
                self.type = 'warn';
                log.apply(self, arguments);
            },
            info: function () {
                self.type = 'info';
                log.apply(self, arguments);
            },
            log: function () {
                self.type = 'log';
                log.apply(self, arguments);
            },
            enabled: false
        };

        var log = function () {

            args = [];
            if (typeof arguments === 'object') {
                for (var i = 0; i < arguments.length; i++) {
                    arg = arguments[i];
                    var exception = {};
                    exception.message = arg.message;
                    exception.stack = arg.stack;
                    args.push(JSON.stringify(exception));
                }
            }

            var logItem = {
                message: args.join('\n'),
                type: type
            };

            customLogService = $injector.get('logService');
            customLogService.logMessage('(Angular exception)', null, logItem.message, logItem.type);
        };

        return service;
    });
