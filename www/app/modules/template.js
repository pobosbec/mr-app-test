mobileresponseWebbApp


    // =========================================================================
    // MAINMENU COLLAPSE
    // =========================================================================

    .directive('toggleSidebar', function(){
        return {
            restrict: 'A',
            scope: {
                modelLeft: '=',
                modelRight: '='
            },
            link: function(scope, element, attr) {
                element.on('click', function(){
 
                    if (element.data('target') === 'mainmenu') {
                        if (scope.modelLeft === false) {
                            scope.$apply(function(){
                                scope.modelLeft = true;
                            })
                        }
                        else {
                            scope.$apply(function(){
                                scope.modelLeft = false;
                            })
                        }
                    }
                    
                    if (element.data('target') === 'chat') {
                        if (scope.modelRight === false) {
                            scope.$apply(function(){
                                scope.modelRight = true;
                            })
                        }
                        else {
                            scope.$apply(function(){
                                scope.modelRight = false;
                            });
                        }
                    }
                });
            }
        }
    })

    // =========================================================================
    // SUBMENU TOGGLE
    // =========================================================================
    .directive('toggleSubmenu', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.click(function(){
                    element.next().slideToggle(200);
                    element.parent().toggleClass('toggled');
                });
            }
        }
    })

    // =========================================================================
    // IMAGE
    // =========================================================================
    .directive('fullSizeImageDiv', function () {
        function link(scope, element) {

        }
        return {
            restrict: 'AE',
            link: link,
            controller: function ($scope, $element) {
                var theImageElement = $element.find('#theImage');
                //alert($element);
                //alert($element.style.height);
                //alert(theImageElement);
                //alert(theImageElement.attr('id'));
                //alert(theImageElement.style.height);
                //alert(theImageElement.prop('offsetHeight'));
                alert($element.prop('offsetHeight')); //Works, but returns 0 immediately when the div is created (if set on the image div)
            }
        };
    })

    // =========================================================================
    // STOP PROPAGATION
    // =========================================================================
    .directive('stopPropagate', function(){
        return {
            restrict: 'C',
            link: function(scope, element) {
                element.on('click', function(event){
                    event.stopPropagation();
                });
            }
        }
    })

    .directive('aPrevent', function(){
        return {
            restrict: 'C',
            link: function(scope, element) {
                element.on('click', function(event){
                    event.preventDefault();
                });
            }
        }
    });



   