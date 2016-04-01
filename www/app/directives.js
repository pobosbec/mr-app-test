mobileresponseWebbApp


    // =========================================================================
    // MAINMENU COLLAPSE
    // =========================================================================
    .directive("outsideClick", ['$document', '$parse', function ($document, $parse) {
        return {
            link: function ($scope, $element, $attributes) {
                var scopeExpression = $attributes.outsideClick,
                    onDocumentClick = function (event) {
                        // For declaring elements that are treated as "inside" without actually being inside.
                        var ignoreOutsideClick = false;
                        if (event.target.dataset["treatAsChildWhenOutside"] === "true" || $(event.target).parents('*[data-treat-as-child-when-outside="true"]').length) {
                            ignoreOutsideClick = true;
                        }

                        var isChild = $element.find(event.target).length > 0;

                        if (!ignoreOutsideClick && !isChild) {
                            $scope.$apply(scopeExpression);
                        }
                    };

                $document.on("click", onDocumentClick);

                $element.on('$destroy', function () {
                    $document.off("click", onDocumentClick);
                });
            }
        }
    }])

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
                //alert($element.prop('offsetHeight')); //Works, but returns 0 immediately when the div is created (if set on the image div)
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
    })

// =========================================================================
// Strong password
// =========================================================================
.directive("strongPassword", function () {
    return {

        // limit usage to argument only
        restrict: 'A',

        // require NgModelController, i.e. require a controller of ngModel directive
        require: "ngModel",

        // create linking function and pass in our NgModelController as a 4th argument
        link: function (scope, elem, attrs, ctrl) {

            // please note you can name your function & argument anything you like
            function customValidator(ngModelValue) {

                // check if contains uppercase
                // if it does contain uppercase, set our custom `uppercaseValidator` to valid/true
                // otherwise set it to non-valid/false
                if (/[A-Z]/.test(ngModelValue)) {
                    ctrl.$setValidity('uppercaseValidator', true);
                } else {
                    ctrl.$setValidity('uppercaseValidator', false);
                }

                // check if contains lowercase
                // if it does contain lowercase, set our custom `lowercaseValidator` to valid/true
                // otherwise set it to non-valid/false
                if (/[a-z]/.test(ngModelValue)) {
                    ctrl.$setValidity('lowercaseValidator', true);
                } else {
                    ctrl.$setValidity('lowercaseValidator', false);
                }

                // check if contains number
                // if it does contain number, set our custom `numberValidator`  to valid/true
                // otherwise set it to non-valid/false
                if (/[0-9]/.test(ngModelValue)) {
                    ctrl.$setValidity('numberValidator', true);
                } else {
                    ctrl.$setValidity('numberValidator', false);
                }

                // check if the length of our input is atleast 8 characters
                // if it is 8, set our custom `sixCharactersValidator` to valid/true
                // othwise set it to non-valid/false
                if (ngModelValue.length > 8) {
                    ctrl.$setValidity('eightCharactersValidator', true);
                } else {
                    ctrl.$setValidity('eightCharactersValidator', false);
                }

                //check if the length of our input is atleast 8 characters
                // if it is 8, set our custom `sixCharactersValidator` to valid/true
                // othwise set it to non-valid/false
                if (ngModelValue.length < 26) {
                    ctrl.$setValidity('maxlengthCharactersValidator', true);
                } else {
                    ctrl.$setValidity('maxlengthCharactersValidator', false);
                }
                // we need to return our ngModelValue, to be displayed to the user(value of the input)
                return ngModelValue;
            }
            // we need to add our customValidator function to an array of other(build-in or custom) functions
            // I have not notice any performance issues, but it would be worth investigating how much
            // effect does this have on the performance of the app
            ctrl.$parsers.push(customValidator);
        }
    }
})
// =========================================================================
// Username validator
// =========================================================================

    .directive("usernameValidator", function () {
        return {

            // limit usage to argument only
            restrict: 'A',
            // require NgModelController, i.e. require a controller of ngModel directive
            require: "ngModel",

            // create linking function and pass in our NgModelController as a 4th argument
            link: function (scope, elem, attrs, ctrl) {

                // please note you can name your function & argument anything you like
                function customValidator(ngModelValue) {

                    // check if the length of our input is atleast 8 characters
                    // if it is 8, set our custom `sixCharactersValidator` to valid/true
                    // othwise set it to non-valid/false
                    if (ngModelValue.length > 8) {
                        ctrl.$setValidity('usernameMinLengthValidator', true);
                    } else {
                        ctrl.$setValidity('usernameMinLengthValidator', false);
                    }

                    // check if the length of our input is less than 26 characters
                    // if it is less than 26, set our custom `sixCharactersValidator` to valid/true
                    // othwise set it to non-valid/false
                    if (ngModelValue.length < 26) {
                        ctrl.$setValidity('usernameMaxLengthValidator', true);
                    } else {
                        ctrl.$setValidity('usernameMaxLengthValidator', false);
                    }

                    // we need to return our ngModelValue, to be displayed to the user(value of the input)
                    return ngModelValue;

                }

                // we need to add our customValidator function to an array of other(build-in or custom) functions
                // I have not notice any performance issues, but it would be worth investigating how much
                // effect does this have on the performance of the app
                ctrl.$parsers.push(customValidator);
            }
        }
    })

    // =========================================================================
    // Focus me
    // =========================================================================

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
    })

   