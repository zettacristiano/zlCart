'use strict';

angular.module('zlCart', ['zlCart.directives'])

.config([function () {}])

.provider('$zlCart', function () {
  this.$get = function () {};
})

.run(['$rootScope', 'zlCart', 'zlCartItem', 'zlStore', function ($rootScope, zlCart, zlCartItem, zlStore) {
  $rootScope.$on('zlCart:change', function () {
    zlCart.$save();
  });

  if (angular.isObject(zlStore.get('zlcart'))) {
    zlCart.$restore(zlStore.get('zlcart'));
  } else {
    zlCart.init();
  }
}])

.service('zlCart', ['$rootScope', 'zlCartItem', 'zlStore', function ($rootScope, zlCartItem, zlStore) {
  this.init = function () {
    this.$cart = {
      shipping: null,
      taxRate: null,
      tax: null,
      items: []
    };
  };

  this.addItem = function (id, name, price, quantity, discount, data) {
    var inCart = this.getItemById(id);
    if (typeof inCart === 'object') {
      //Update quantity of an item if it's already in the cart
      inCart.setQuantity(quantity, false);
    } else {
      var newItem = new zlCartItem(id, name, price, quantity, discount, data);
      this.$cart.items.push(newItem);
      $rootScope.$broadcast('zlCart:itemAdded', newItem);
    }

    $rootScope.$broadcast('zlCart:change', {});
  };

  this.getItemById = function (itemId) {
    var items = this.getCart().items;
    var build = false;

    angular.forEach(items, function (item) {
      if (item.getId() === itemId) {
        build = item;
      }
    });
    return build;
  };

  this.setShipping = function (shipping) {
    this.$cart.shipping = shipping;
    return this.getShipping();
  };
  this.getShipping = function () {
    if (this.getCart().items.length == 0) return 0;
    return this.getCart().shipping;
  };

  this.setTaxRate = function (taxRate) {
    this.$cart.taxRate = +parseFloat(taxRate).toFixed(2);
    return this.getTaxRate();
  };
  this.getTaxRate = function () {
    return this.$cart.taxRate
  };

  this.getTax = function () {
    return +parseFloat((this.getSubTotal() / 100) * this.getCart().taxRate).toFixed(2);
  };

  this.setCart = function (cart) {
    this.$cart = cart;
    return this.getCart();
  };
  this.getCart = function () {
    return this.$cart;
  };

  this.getItems = function () {
    return this.getCart().items;
  };

  this.getTotalItems = function () {
    var count = 0;
    var items = this.getItems();
    angular.forEach(items, function (item) {
      count += item.getQuantity();
    });
    return count;
  };

  this.getTotalUniqueItems = function () {
    return this.getCart().items.length;
  };

  this.getSubTotal = function () {
    var total = 0;
    angular.forEach(this.getCart().items, function (item) {
      total += item.getTotal();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getSubTotalWithDiscount = function () {
    var total = 0;
    angular.forEach(this.getCart().items, function (item) {
      total += item.getTotalWithDiscount();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getTotalDiscount = function () {
    var total = +parseFloat(this.getSubTotal() - this.getSubTotalWithDiscount()).toFixed(2);
    if (total < 0) total = 0;
    return total;
  };

  this.totalCost = function () {
    return +parseFloat(this.getSubTotal() - this.getTotalDiscount() + this.getShipping() + this.getTax()).toFixed(2);
  };

  this.removeItem = function (index) {
    this.$cart.items.splice(index, 1);
    $rootScope.$broadcast('zlCart:itemRemoved', {});
    $rootScope.$broadcast('zlCart:change', {});
  };

  this.removeItemById = function (id) {
    var cart = this.getCart();
    angular.forEach(cart.items, function (item, index) {
      if (item.getId() === id) {
        cart.items.splice(index, 1);
      }
    });
    this.setCart(cart);
    $rootScope.$broadcast('zlCart:itemRemoved', {});
    $rootScope.$broadcast('zlCart:change', {});
  };

  this.empty = function () {
    $rootScope.$broadcast('zlCart:change', {});
    this.$cart.items = [];
    localStorage.removeItem('zlcart');
  };

  this.isEmpty = function () {
    return (this.$cart.items.length > 0 ? false : true);
  };

  this.toObject = function () {
    if (this.getItems().length === 0) return false;
    var items = [];
    angular.forEach(this.getItems(), function (item) {
      items.push(item.toObject());
    });

    return {
      shipping: this.getShipping(),
      tax: this.getTax(),
      taxRate: this.getTaxRate(),
      subTotal: this.getSubTotal(),
      totalCost: this.totalCost(),
      items: items
    }
  };

  this.$restore = function (storedCart) {
    var _self = this;
    _self.init();
    _self.$cart.shipping = storedCart.shipping;
    _self.$cart.tax = storedCart.tax;

    angular.forEach(storedCart.items, function (item) {
      _self.$cart.items.push(new zlCartItem(item._id, item._name, item._price, item._quantity, item._discount, item._data));
    });
    this.$save();
  };

  this.$save = function () {
    return zlStore.set('zlcart', JSON.stringify(this.getCart()));
  }
}])

.factory('zlCartItem', ['$rootScope', '$log', function ($rootScope, $log) {
  var item = function (id, name, price, quantity, discount, data) {
    this.setId(id);
    this.setName(name);
    this.setPrice(price);
    this.setDiscount(discount);
    this.setQuantity(quantity);
    this.setData(data);
  };

  item.prototype.setId = function (id) {
    if (id) this._id = id;
    else {
      $log.error('An ID must be provided');
    }
  };
  item.prototype.getId = function () {
    return this._id;
  };

  item.prototype.setName = function (name) {
    if (name) this._name = name;
    else {
      $log.error('A name must be provided');
    }
  };
  item.prototype.getName = function () {
    return this._name;
  };

  item.prototype.setPrice = function (price) {
    var priceFloat = parseFloat(price);
    if (priceFloat) {
      if (priceFloat <= 0) {
        $log.error('A price must be over 0');
      } else {
        this._price = (priceFloat);
      }
    } else {
      $log.error('A price must be provided');
    }
  };
  item.prototype.getPrice = function () {
    return this._price;
  };
  item.prototype.getPriceWithDiscount = function () {
    return this._price - (this._price * (this.getDiscount() / 100));
  };

  item.prototype.setDiscount = function (discount, relative) {
    var discountInt = parseInt(discount);
    if (discountInt) {
      if (discountInt <= 0) {
        $log.error('A discount must be over 0');
      } else {
        this._discount = (discountInt);
      }
    } else {
      this._discount = 0;
      $log.error('A discount must be provided');
    }
  };
  item.prototype.getDiscount = function () {
    return this._discount;
  };

  item.prototype.setQuantity = function (quantity, relative) {
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

  item.prototype.getQuantity = function () {
    return this._quantity;
  };

  item.prototype.setData = function (data) {
    if (data) this._data = data;
  };
  item.prototype.getData = function () {
    if (this._data) return this._data;
    else $log.info('This item has no data');
  };

  item.prototype.getTotal = function () {
    return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
  };
  item.prototype.getTotalWithDiscount = function () {
    return +parseFloat(this.getQuantity() * this.getPriceWithDiscount()).toFixed(2);
  };

  item.prototype.toObject = function () {
    return {
      id: this.getId(),
      name: this.getName(),
      price: this.getPrice(),
      priceWithDiscount: this.getPriceWithDiscount(),
      discount: this.getDiscount(),
      quantity: this.getQuantity(),
      data: this.getData(),
      total: this.getTotal(),
      totalWithDiscount: this.getTotalWithDiscount()
    }
  };
  return item;
}])

.service('zlStore', ['$window', function ($window) {
  return {
    get: function (key) {
      if ($window.localStorage[key]) {
        var cart = angular.fromJson($window.localStorage[key]);
        return JSON.parse(cart);
      }
      return false;
    },


    set: function (key, val) {
      if (val === undefined) {
        $window.localStorage.removeItem(key);
      } else {
        $window.localStorage[key] = angular.toJson(val);
      }
      return $window.localStorage[key];
    }
  }
}])

.service('zlCartDiscount', ['$rootScope', 'zlCart', '$http', '$q', function ($rootScope, zlCart, $http, $q) {
  this.init = function () {
    this.urlDiscount = "/api/getdiscount/";
  };

  this.setUrlDiscount = function(url){
    this.urlDiscount = url;
  };

  this.getUrlDiscount = function(){
    return this.urlDiscount;
  };

  this.setDiscount = function (code) {
    var deferred = $q.defer();
    $http.get(this.getUrlDiscount() + code).then(function (response) {
      var discount = response.data;
      angular.forEach(discount.products, function (product) {
        if (product.check) {
          zlCart.getItemById(product._id.toString()).setDiscount(discount.discount);
        }
      });
      $rootScope.$broadcast('zlCart:change', {});
      deferred.resolve();
    }, function (error) {
      deferred.reject();
    })
    return deferred.promise;
  }
}])

.controller('CartController', ['$scope', 'zlCart', function ($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.value('version', '1.0.0');;'use strict';

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
    controller: ('zlCartController', ['$rootScope', '$scope', 'zlCart', 'fulfilmentProvider', function ($rootScope, $scope, zlCart, fulfilmentProvider) {
      $scope.zlCart = zlCart;

      $scope.checkout = function () {
        fulfilmentProvider.setService($scope.service);
        fulfilmentProvider.setSettings($scope.settings);
        fulfilmentProvider.checkout()
          .success(function (data, status, headers, config) {
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
}]);;angular.module('zlCart.fulfilment', [])

.service('fulfilmentProvider', ['$injector', function ($injector) {
  this._obj = {
    service: undefined,
    settings: undefined
  };

  this.setService = function (service) {
    this._obj.service = service;
  };

  this.setSettings = function (settings) {
    this._obj.settings = settings;
  };

  this.checkout = function () {
    var provider = $injector.get('zlCart.fulfilment.' + this._obj.service);
    return provider.checkout(this._obj.settings);
  }
}])

.service('zlCart.fulfilment.log', ['$q', '$log', 'zlCart', function ($q, $log, zlCart) {
  this.checkout = function () {
    var deferred = $q.defer();
    $log.info(zlCart.toObject());
    deferred.resolve({
      cart: zlCart.toObject()
    });
    return deferred.promise;
  }
}])

.service('zlCart.fulfilment.http', ['$http', 'zlCart', function ($http, zlCart) {
  this.checkout = function (settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject(),
      options: settings.options
    });
  }
}])

.service('zlCart.fulfilment.meowalet', ['$http', 'zlCart', function ($http, zlCart) {
  this.checkout = function (settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject(),
      options: settings.options
    });
  }
}])

.service('zlCart.fulfilment.paypal', ['$http', 'zlCart', function ($http, zlCart) {

}]);