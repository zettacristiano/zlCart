'use strict';

angular.module('zlCart.directives', ['zlCart.fulfilment'])

.controller('zlCartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.directive('zlcartAddtocart', ['zlCart', function(zlCart) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {
      id: '@',
      name: '@',
      quantity: '@',
      quantityMax: '@',
      price: '@',
      tax: '@',
      data: '='
    },
    transclude: true,
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/addtocart.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {
      scope.attrs = attrs;
      scope.inCart = function() {
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

.directive('zlcartCart', [function() {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/cart.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {

    }
  };
}])

.directive('zlcartSummary', [function() {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/summary.html';
      } else {
        return attrs.templateUrl;
      }
    }
  };
}])

.directive('zlcartTax', ['zlCart', function(zlCart) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/carttax.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {
      function init() {
        var flags = [];
        var taxOut = [];
        var total = 0;
        angular.forEach(zlCart.getCart().items, function(item) {
          var taxRate = item.getTax();
          var taxTotal = item.getTotalWithDiscount();
          var taxValue = +parseFloat(taxTotal / 100 * taxRate).toFixed(2);
          if (!flags[taxRate]) {
            flags[taxRate] = true;
            taxOut.push({
              rate: taxRate,
              tax: taxValue,
              value: taxTotal
            });
          } else {
            for (var x = 0; x < taxOut.length; x++) {
              if (taxOut[x].rate !== taxRate) continue;
              taxOut[x].tax += taxValue;
              taxOut[x].value += taxTotal;
            }
          }
        });
        taxOut.forEach(function(item) {
          total += item.value;
        })

        scope.taxsRate = taxOut;
        scope.taxTotal = total;
      }
      scope.$on("zlCart:change", function() {
        init();
      });
      init();
    }
  };
}])

.directive('zlcartDiscount', ['zlCartDiscount', function(zlCartDiscount) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    replace: false,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/discount.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {
      scope.attrs = attrs;
      scope.message = {};
      if (scope.zlCart.getPromoCode()) {
        scope.code = scope.zlCart.getPromoCode();
      }
      scope.$watch('code', function(newValue, oldValue) {
        if (newValue !== oldValue) scope.message = {};
      });

      scope.setCodeDiscount = function(code) {
        zlCartDiscount.setDiscount(code, function(err) {
          scope.message.msg = true;
          if (err) {
            scope.message.success = false;
            scope.message.text = err.data;
            return;
          }

          scope.message.success = true;
          scope.message.text = 'Código consumido com sucesso.';

          scope.code = "";
        });
      };
    }
  };
}])

.directive('zlcartCheckout', [function() {
  return {
    restrict: 'E',
    scope: {
      service: '@',
      settings: '='
    },
    transclude: true,
    replace: false,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/checkout.html';
      } else {
        return attrs.templateUrl;
      }
    },
    controller: ('zlCartController', ['$rootScope', '$scope', '$window', 'zlCart', 'fulfilmentProvider', function($rootScope, $scope, $window, zlCart, fulfilmentProvider) {
      $scope.zlCart = zlCart;

      $scope.checkout = function() {
        fulfilmentProvider.setService($scope.service);
        fulfilmentProvider.setSettings($scope.settings);
        fulfilmentProvider.checkout()
          .then(function(data, status, headers, config) {
            if ($scope.service === 'meowallet') {
              $window.location.href = data.url_redirect;
            }
            $rootScope.$broadcast('zlCart:checkout_succeeded', data);
          })
          .catch(function(data, status, headers, config) {
            $rootScope.$broadcast('zlCart:checkout_failed', {
              statusCode: status,
              error: data
            });
          });
      }
    }])
  };
}]);