mobileresponseWebbApp

    // =========================================================================
    // MALIHU SCROLL
    // =========================================================================
    
    //On Custom Class
    .directive('cOverflow', ['scrollService', function(scrollService){
        return {
            restrict: 'C',
            link: function(scope, element) {

                if (!$('html').hasClass('ismobile')) {
                    scrollService.malihuScroll(element, 'minimal-dark', 'y');
                }
            }
        }
    }])
    .directive('focusMe', function ($timeout) {
        return {
            link: function (scope, element, attr) {
                attr.$observe('focusMe', function (value) {
                    if (value === "true") {
                        $timeout(function () {
                            element[0].focus();
                        });
                    }
                });
            }
        };
    });

