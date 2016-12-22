'use strict';

angular.module('zlCart.directives', ['zlCart.fulfilment'])

.controller('zlCartController', ['$scope', 'zlCart', function ($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.directive('zlcartAddtocart', ['zlCart', function (zlCart) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {
      id: '@',
      name: '@',
      quantity: '@',
      quantityMax: '@',
      price: '@',
      data: '='
    },
    transclude: true,
    templateUrl: function (element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/zlCart/addtocart.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function (scope, element, attrs) {
      scope.attrs = attrs;
      scope.inCart = function () {
        return zlCart.getItemById(attrs.id);
      };

      if (scope.inCart()) {
        scope.q = zlCart.getItemById(attrs.id).getQuantity();
      } else {
        scope.q = parseInt(scope.quantity);
      }

      scope.qtyOpt = [];
      for (var i = 1; i <= scope.quantityMax; i++) {
        scope.qtyOpt.push(i);
      }
    }
  };
}])

.directive('zlcartCart', [function () {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    templateUrl: function (element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/zlCart/cart.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function (scope, element, attrs) {

    }
  };
}])

.directive('zlcartSummary', [function () {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    templateUrl: function (element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/zlCart/summary.html';
      } else {
        return attrs.templateUrl;
      }
    }
  };
}])

.directive('zlcartDiscount', ['zlCartDiscount', function (zlCartDiscount) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    templateUrl: function (element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/zlCart/discount.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function (scope, element, attrs) {
      scope.attrs = attrs;
      scope.$watch('code', function () {
        scope.message = null;
      });
      scope.setCodeDiscount = function (code) {
        zlCartDiscount.setDiscount(code).then(function (success) {
          scope.message = {
            success: true,
            text: 'Código consumido com sucesso.'
          };
          scope.code = "";
        }).catch(function (err) {
          scope.message = {
            success: false,
            text: 'Não possível consumir o código.'
          };
        });
      };
    }
  };
}])

.directive('zlcartCheckout', [function () {
  return {
    restrict: 'E',
    controller: ('zlCartController', ['$rootScope', '$scope', '$window', 'zlCart', 'fulfilmentProvider', function ($rootScope, $scope, $window, zlCart, fulfilmentProvider) {
      $scope.zlCart = zlCart;

      $scope.checkout = function () {
        fulfilmentProvider.setService($scope.service);
        fulfilmentProvider.setSettings($scope.settings);
        fulfilmentProvider.checkout()
          .success(function (data, status, headers, config) {
            if ($scope.service === 'meowallet') {
              $window.location.href = data.data.url_redirect;
            }
            $rootScope.$broadcast('zlCart:checkout_succeeded', data);
          })
          .error(function (data, status, headers, config) {
            $rootScope.$broadcast('zlCart:checkout_failed', {
              statusCode: status,
              error: data
            });
          });
      }
    }]),
    scope: {
      service: '@',
      settings: '='
    },
    transclude: true,
    templateUrl: function (element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/zlCart/checkout.html';
      } else {
        return attrs.templateUrl;
      }
    }
  };
}]);