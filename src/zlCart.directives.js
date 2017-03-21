//ZLCART.DIRECTIVES.JS
'use strict';

angular.module('zlCart.directives', ['zlCart.fulfilment'])

.controller('zlCartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.directive('zlcartAddtocart', ['zlCart', 'zlCartDiscount', function(zlCart, zlCartDiscount) {
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
      data: '=',
      checkItem: '@?'
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
        if (attrs.checkItem) {
          return zlCart.getItemByRegex(attrs.checkItem);
        } else {
          return zlCart.getItemById(attrs.id);
        }
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
      var inProcess = false;

      function init() {
        var flags = [];
        var taxOut = [];
        var total = 0;
        var totalIva = 0;
        angular.forEach(zlCart.getItems(), function(item) {
          var rate = item.getTax();
          var taxValue = item.getTotalWithTax() - item.getTotal();
          var taxPrice = item.getTotal();
          var taxPriceTax = +(taxValue + taxPrice);
          if (!flags[rate]) {
            flags[rate] = true;
            taxOut.push({
              rate: rate,
              tax: taxValue,
              value: taxPrice,
              subTotal: taxPriceTax
            });
          } else {
            for (var x = 0; x < taxOut.length; x++) {
              if (taxOut[x].rate !== rate) { continue; }
              taxOut[x].tax += taxValue;
              taxOut[x].value += taxPrice;
              taxOut[x].subTotal += taxPriceTax;
            }
          }
          total += taxPriceTax;
          totalIva += taxValue;
        });

        scope.taxsRate = taxOut;
        scope.taxTotalIva = totalIva;
        scope.taxTotal = total;
        inProcess = false;
      }
      init();

      scope.$on("zlCart:change", function(event, args) {
        if (!inProcess) {
          inProcess = true;
          init();
        }
      });
    }
  };
}])

.directive('zlcartDiscount', ['zlCart', 'zlCartDiscount', function(zlCart, zlCartDiscount) {
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
      if (zlCart.getPromo()) {
        scope.code = zlCart.getPromo().code;
      }
      scope.$watch('code', function(newValue, oldValue) {
        if (newValue !== oldValue) scope.message = {};
      });

      scope.removeCodeDiscount = function(code) {
        zlCart.setPromo(null);
      };

      scope.setCodeDiscount = function(code) {
        zlCartDiscount.setDiscount(code, function(err) {
          scope.message.msg = true;
          if (err) {
            scope.message.success = false;
            scope.message.text = err;
            return;
          }

          scope.message.success = true;
          scope.message.text = 'Código aplicado com sucesso.';
          scope.code = (zlCart.getPromo() || {}).code;
          setTimeout(function() {
            scope.message.msg = false;
            scope.$apply();
          }, 2500);
        });
      };

      scope.$on("zlCart:itemAdded", function(newItem) {
        zlCart.setPromo(zlCart.getPromo());
      });
    }
  };
}])

.directive('zlcartCheckout', [function() {
  return {
    restrict: 'E',
    scope: { service: '@', settings: '=' },
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
        fulfilmentProvider.checkout().then(function(response) {
          if (response.data.url_redirect) {
            $window.location.href = response.data.url_redirect;
          }
          $rootScope.$broadcast('zlCart:checkout_succeeded', data);
        }).catch(function(response) {
          $rootScope.$broadcast('zlCart:checkout_failed', {
            statusCode: response.status,
            error: response.data
          });
        });
      };
    }])
  };
}]);