// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
angular.module('modalcontroll',[])
    .controller('createMessageCtrl', function ($scope, $uibModalInstance) {

    $scope.createMsg = function () {
        alert('noothing');
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});/**
 * Created by Robin Jobb on 2016-03-30.
 */
