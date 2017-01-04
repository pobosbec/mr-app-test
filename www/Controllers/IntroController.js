mrApp.controller('IntroController',
[
    '$scope', '$location', '$localStorage', 'SettingsFactory', 'SharedState',
    function(
        $scope,
        $location,
        $localStorage,
        settingsFactory,
        SharedState) {

        $scope.currentPage = 1;
        $scope.content = null;
        $scope.numberOfPages = 1;

        $scope.introContent = [
            {
                'heading': 'Welcome',
                'ingress': 'Welcome to the Mobile Response Messaging App',
                'text':'This app requires a Mobile Response account',
                'image': './images/mr-logo-vertical.png'
            },
            {
                'heading': 'Login',
                'ingress': 'Rutrum. Aliquam hendrerit ornare orci. Integer sit amet pulvinar tellus. Pellentesque venenatis, lectus sed mollis eleifend, sem mi mattis enim, ut semper nunc eros eu nisi. ',
                'text': '',
                'image': './images/intro/Screenshot_Login.png'
            },
            {
                'heading': 'Conversations',
                'ingress': 'Morbi euismod feugiat lacus quis finibus. ',
                'text': 'Nunc ante eros, euismod in tellus eu, tincidunt fermentum erat.',
                'image': './images/intro/Screenshot_Conversations.png'
            },
            {
                'heading': 'Get Started',
                'image': './images/mr-logo-vertical.png'
            }
        ];
        
        function init() {
            SharedState.initialize($scope, 'introModal', '');
            $scope.numberOfPages = $scope.introContent.length;

            if ($localStorage.showIntro === undefined) {
                $localStorage.showIntro = true;
                $localStorage.introCurrentPage = $scope.currentPage;
            }

            if ($localStorage.showIntro) {
                SharedState.turnOn('introModal');
                gotoPage($scope.currentPage);
            } 
        }

        function gotoPage(pageIndex) {
            $localStorage.introCurrentPage = $scope.currentPage;
            if (pageIndex <= $scope.numberOfPages) {
                $scope.currentPage = pageIndex;
                $scope.content = $scope.introContent[pageIndex - 1];
            } else {
                //closeIntro();
            }
            
        }

        function closeIntro() {
            $localStorage.showIntro = false;
            $location.path('/login/');
        }

        $scope.gotoPage = function(pageIndex) {
            gotoPage(pageIndex);
        };

        $scope.closeIntro = function () {
            console.log("Close");
            closeIntro();
        };

        init();
    }
]);