mrApp.controller('IntroController',
[
    '$scope', '$location', '$localStorage','$routeParams', 'SettingsFactory', 'SharedState',
    function(
        $scope,
        $location,
        $localStorage,
        $routeParams,
        settingsFactory,
        SharedState) {

        var initState = $routeParams.param1;

        $scope.initState = initState;

        $scope.currentPage = 1;
        $scope.content = null;
        $scope.numberOfPages = 1;

        $scope.introContent = [
            {
                'heading': 'Welcome',
                'ingress': 'Welcome to the Mobile Response Messaging App',
                'text': 'This app requires a Mobile Response account',
                'image': './images/mr-logo-vertical.png'
            },
            {
                'heading': 'Register',
                'ingress': 'To register a new user, simply select a username and password on the register page.',
                'text': '',
                'image': './images/intro/Screenshot_Register.png'
            },
            {
                'heading': 'Login',
                'ingress': 'Once you have registered, sign in on the login page.',
                'text': '',
                'image': './images/intro/Screenshot_Login.png'
            },
            {
                'heading': 'Add Your Number',
                'ingress': 'In order to receive any messages sent to your number, go to "profile" in the menu and write your phone number with country prefix.',
                'text': '',
                'image': './images/intro/Screenshot_Profile.png'
            },
            {
                'heading': 'Inbox',
                'ingress': 'Every conversation you are a part of will be listed here. A new conversation will be opened when created or when receiving a message from a new contact.',
                'text': '',
                'image': './images/intro/Screenshot_Inbox.png'
            },
            {
                'heading': 'Conversation',
                'ingress': 'Every conversation you are a part of will be listed here. A new conversation will be opened when created or when receiving a message from a new contact.',
                'text': '',
                'image': './images/intro/Screenshot_Conversation.png'
            },
            {
                'heading': 'Create New Conversation',
                'ingress': 'To create a new conversation, search for the recipients in the search bar. Then press the plus icon to the right. You can then scroll down, input the initial message, and press "Create new conversation"',
                'text': '',
                'image': './images/intro/Screenshot_Create.png'
            },
            {
                'heading': 'Get Started',
                'ingress': '',
                'text': 'That concludes the introduction. You can find the introduction in the main menu, should you need it.',
                'image': './images/mr-logo-vertical.png'
            }
        ];
        
        function init() {
            SharedState.initialize($scope, 'introModal', '');
            $scope.numberOfPages = $scope.introContent.length;
            
            if (initState !== 'manual') {
                if ($localStorage.showIntro === undefined) {
                    $localStorage.showIntro = true;
                    $localStorage.introCurrentPage = $scope.currentPage;
                }

                if ($localStorage.showIntro) {
                    SharedState.turnOn('introModal');
                    gotoPage($scope.currentPage);
                } else {
                    SharedState.turnOff('introModal');
                }

            } else {
                SharedState.turnOn('introModal');
                gotoPage($scope.currentPage);
            } 

        }

        function gotoPage(pageIndex) {
            $localStorage.introCurrentPage = $scope.currentPage;
            if (pageIndex <= $scope.numberOfPages) {
                $scope.currentPage = pageIndex;
                $scope.content = $scope.introContent[pageIndex - 1];
            } 
        }

        function closeIntro() {
            if (initState !== 'manual') {
                $localStorage.showIntro = false;
            }
            SharedState.turnOff('introModal');
            $location.path('/login/');
        }

        $scope.gotoPage = function(pageIndex) {
            gotoPage(pageIndex);
        };

        $scope.closeIntro = function () {
            closeIntro();
        };

        init();
    }
]);