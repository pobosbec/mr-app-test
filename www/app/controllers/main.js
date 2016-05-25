mobileresponseWebbApp
    // =========================================================================
    // Base controller for common functions
    // =========================================================================
    .controller('materialadminCtrl', function($timeout, $state, $rootScope,tokenService, $scope, snapRemote, $uibModal){
        
        $rootScope.createButtonVisible = false;
        $rootScope.slowConnection = false;

        // process the confirmation dialog result
        function onConfirm(buttonIndex) {
            if(buttonIndex == 1){
            $rootScope.logout();
            }
        }

        $scope.debug = true;

        $scope.logoutConfirm = function() {
            if(isPhoneGap){
                console.log("Logout clicked on isPhoneGap device, calling notification.confirm");
                navigator.notification.confirm(
                    'By loging out you will clear contacts and other local storage', // message
                    onConfirm,            // callback to invoke with index of button pressed
                    'Logout',           // title
                    ['Logout','Cancel']         // buttonLabels
                );
            }
            else{$rootScope.logout();}
        };


        //////////////////////////
        /// Modal
        ///////////////////////////
        $scope.animationsEnabled = true;

        $scope.opencreate = function (size) {
            $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'template/create-message-modal.html',
                controller: 'createMessageCtrl',
                size: size
            });
        };

        $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
        };
        $scope.ok = function () {
            $uibModalInstance.close($scope.selected.item);
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $rootScope.header = false;
        //snapper
        snapRemote.getSnapper().then(function(snapper){
            $rootScope.snapperControl = snapper;

        });

        //ui router
        $rootScope.$state = $state;

        //username
        $scope.username = tokenService.getUsername; //passing getter to the view

        //message listing view
        $scope.messageViewMode = 1;

        this.changeMessageView = function (event) {
            $scope.messageViewMode = event.target.id;
        };

        // Detect Mobile Browser
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
           angular.element('html').addClass('ismobile');
        }

        //// By default Sidbars are hidden in boxed layout and in wide layout only the right sidebar is hidden.
        //this.sidebarToggle = {
        //    left: false,
        //    right: false
        //};

        // By default template has a boxed layout
        this.layoutType = localStorage.getItem('ma-layout-status');
        
        // For Mainmenu Active Class
        this.$state = $state;    
        //
        ////Close sidebar on click
        //this.sidebarStat = function(event) {
        //    if (!angular.element(event.target).parent().hasClass('active')) {
        //        this.sidebarToggle.left = false;
        //    }
        //};

        //Listview menu toggle in small screens
        this.lvMenuStat = false;

        //Skin Switch
        this.currentSkin = 'blue';
        this.skinList = [
            'lightblue',
            'bluegray',
            'cyan',
            'teal',
            'green',
            'orange',
            'blue',
            'purple'
        ];
    })

    // =========================================================================
    // Message
    // =========================================================================
    .controller('messageCtrl', function($timeout, $scope){

        $scope.showAttachedImage = 0;
        $scope.imageClasses = '';

        this.toggleShowImage = function (event) {
            if ($scope.showAttachedImage == 1) {
                $scope.showAttachedImage = 0;
            }
            else {
                $scope.showAttachedImage = 1;
            }

            $scope.imageClasses = 'fullSize rotate90';

            //var image = document.getElementById("theImage");
            //alert(image.height + ' ' + image.width);

            //alert($scope);
            //alert($scope.theImageElement);

            //alert($scope.theImageElement);
        };
    })

    // =========================================================================
    // Header
    // =========================================================================
    .controller('headerCtrl', function($timeout){
    });

