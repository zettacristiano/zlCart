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
item.prototype.setName = function(name) {
  if (name) this._name = name;
  else {
    $log.error('A name must be provided');
  }
};

item.prototype.getName = function() {
  return this._name;
};

item.prototype.setTax = function(tax) {
  this._tax = +tax;
};

item.prototype.getTax = function(tax) {
  return this._tax;
};

item.prototype.setPrice = function(price) {
  var priceFloat = parseFloat(price || 0);
  if (priceFloat >= 0) {
    this._price = priceFloat;
  } else {
    $log.error('A price must be over 0');
  }
};

item.prototype.getPrice = function() {
  return this._price;
};

item.prototype.getPriceWithoutTax = function() {
  return this._price - (this._price / 100 * this._tax);
};

item.prototype.getPriceWithDiscount = function() {
  var priceFloat = this.getPrice();
  return priceFloat - (priceFloat * (this.getDiscount() / 100));
};

item.prototype.setDiscount = function(discount) {
  var discountInt = parseInt(discount || 0);
  if (discountInt >= 0) {
    this._discount = discountInt;
  } else {
    this._discount = 0;
  }
  $rootScope.$broadcast('zlCart:change', {});
};

item.prototype.getDiscount = function() {
  return this._discount;
};

item.prototype.setQuantity = function(quantity, relative) {
  var quantityInt = parseInt(quantity);
  if (quantityInt % 1 === 0) {
    if (relative === true) {
      this._quantity += quantityInt;
    } else {
      this._quantity = quantityInt;
    }
    if (this._quantity < 1) this._quantity = 1;

  } else {
    this._quantity = 1;
    $log.info('Quantity must be an integer and was defaulted to 1');
  }
  $rootScope.$broadcast('zlCart:change', {});
};

item.prototype.getQuantity = function() {
  return this._quantity;
};

item.prototype.setData = function(data) {
  if (data) this._data = data;
};

item.prototype.getData = function() {
  if (this._data) return this._data;
  else $log.info('This item has no data');
};

item.prototype.getTotal = function() {
  return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
};

item.prototype.getTotalWithoutTax = function() {
  return +parseFloat(this.getQuantity() * this.getPriceWithoutTax()).toFixed(2);
};

item.prototype.getTotalWithDiscount = function() {
  return +parseFloat(this.getQuantity() * this.getPriceWithDiscount()).toFixed(2);
};

item.prototype.toObject = function() {
  return {
    id: this.getId(),
    name: this.getName(),
    price: this.getPrice(),
    priceWithoutTax: this.getPriceWithoutTax(),
    priceWithDiscount: this.getPriceWithDiscount(),
    tax: this.getTax(),
    discount: this.getDiscount(),
    quantity: this.getQuantity(),
    data: this.getData(),
    total: this.getTotal(),
    totalWithoutTax: this.getTotalWithoutTax(),
    totalWithDiscount: this.getTotalWithDiscount()
  }
};
return item;
}])

.service('zlStore', ['$window', function($window) {
  return {
    get: function(key) {
      if ($window.localStorage[key]) {
        var cart = angular.fromJson($window.localStorage[key]);
        return JSON.parse(cart);
      }
      return false;
    },


    set: function(key, val) {
      if (val === undefined) {
        $window.localStorage.removeItem(key);
      } else {
        $window.localStorage[key] = angular.toJson(val);
      }
      return $window.localStorage[key];
    }
  }
}])

.service('zlCartDiscount', ['$rootScope', 'zlCart', '$http', '$q', function($rootScope, zlCart, $http, $q) {
  this.init = function() {
    this.urlDiscount = "/api/getdiscount/";
  };

  this.setUrlDiscount = function(url) {
    this.urlDiscount = url;
  };

  this.getUrlDiscount = function() {
    return this.urlDiscount;
  };

  this.setDiscount = function(code, callback) {
    var cart = zlCart.getCart();
    $http.post(this.getUrlDiscount() + code, {
      cart: cart
    }).then(function(response) {
      if (response.data) {
        zlCart.setPromoCode(code);
        zlCart.$restore(angular.fromJson(response.data));
      }
      callback();
    }).catch(function(error) {
      callback(error);
    });
  };
}])

.controller('CartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.value('version', '1.0.12');
.value('version', '1.0.12');