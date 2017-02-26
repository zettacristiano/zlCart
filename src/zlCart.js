//ZLCART.JS
'use strict';

angular.module('zlCart', ['zlCart.directives'])

.config([function() {}])

.provider('$zlCart', function() {
  this.$get = function() {};
})

.run(['$rootScope', 'zlCart', 'zlCartItem', 'zlStore', function($rootScope, zlCart, zlCartItem, zlStore) {
  $rootScope.$on('zlCart:change', function() {
    zlCart.$save();
  });

  if (angular.isObject(zlStore.get('zlcart'))) {
    zlCart.$restore(zlStore.get('zlcart'));
  } else {
    zlCart.init();
  }
}])

.service('zlCart', ['$rootScope', 'zlCartItem', 'zlStore', function($rootScope, zlCartItem, zlStore) {
  this.init = function() {
    this.$cart = {
      shipping: null,
      promo: null,
      canBuy: false,
      items: []
    };
  };

  this.addItem = function(id, name, price, tax, quantity, discount, data) {
    var inCart = this.getItemById(id);
    if (typeof inCart === 'object') {
      //Update quantity of an item if it's already in the cart
      inCart.setQuantity(quantity);
    } else {
      var newItem = new zlCartItem(id, name, price, tax, quantity, discount, data);
      this.$cart.items.push(newItem);
      $rootScope.$broadcast('zlCart:itemAdded', newItem);
    }

    $rootScope.$broadcast('zlCart:change', {});
  };

  this.getItemById = function(itemId) {
    var items = this.getCart().items;
    var build = false;

    angular.forEach(items, function(item) {
      if (item.getId() === itemId) {
        build = item;
      }
    });
    return build;
  };

  this.getItemByRegex = function(expression) {
    var items = this.getCart().items;
    var build = false;
    var exp = new RegExp(expression, "ig");
    angular.forEach(items, function(item) {
      if (exp.test(item.getId())) {
        build = item;
      }
    });
    return build;
  };

  this.setStatusPay = function(status) {
    this.$cart.canBuy = status;
    return this.getStatusPay();
  };

  this.getStatusPay = function() {
    return (this.getCart().canBuy && this.getPromo() && this.getTotalItems() > 0);
  };

  this.setPromo = function(code) {
    if (!code) {
      this.getCart().items.forEach(function(item) {
        item.setDiscount(0);
      });
      this.$cart.promo = null;
      this.$cart.canBuy = true;
    } else {
      this.$cart.promo = code;
    }
    $rootScope.$broadcast('zlCart:change', {});
    return this.getPromo();
  };

  this.getPromo = function() {
    return this.getCart().promo || true;
  };

  this.setShipping = function(shipping) {
    this.$cart.shipping = shipping;
    return this.getShipping();
  };

  this.getShipping = function() {
    if (this.getCart().items.length == 0) return 0;
    return this.getCart().shipping;
  };

  this.setCart = function(cart) {
    this.$cart = cart;
    return this.getCart();
  };

  this.getCart = function() {
    return this.$cart;
  };

  this.getItems = function() {
    return this.getCart().items;
  };

  this.getTotalItems = function() {
    var count = 0;
    var items = this.getItems();
    angular.forEach(items, function(item) {
      count += item.getQuantity();
    });
    return count;
  };

  this.getTotalUniqueItems = function() {
    return this.getCart().items.length;
  };

  this.getSubTotal = function(tax) {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotal(tax);
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getSubTotalWithDiscount = function(tax) {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotalWithDiscount(tax);
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getTotalDiscount = function(tax) {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotal(tax) - item.getTotalWithDiscount(tax);
    });
    return +parseFloat(total).toFixed(2);
  };

  this.totalCost = function(tax) {
    return +parseFloat(this.getSubTotal(tax) - this.getTotalDiscount(tax) + this.getShipping());
  };

  this.removeItem = function(index) {
    this.$cart.items.splice(index, 1);
    $rootScope.$broadcast('zlCart:itemRemoved', {});
    $rootScope.$broadcast('zlCart:change', {});
  };

  this.removeItemById = function(id) {
    var cart = this.getCart();
    angular.forEach(cart.items, function(item, index) {
      if (item.getId() === id) {
        cart.items.splice(index, 1);
      }
    });
    this.setCart(cart);
    $rootScope.$broadcast('zlCart:itemRemoved', {});
    $rootScope.$broadcast('zlCart:change', {});
  };

  this.empty = function() {
    $rootScope.$broadcast('zlCart:change', {});
    this.$cart.items = [];
    localStorage.removeItem('zlcart');
  };

  this.isEmpty = function() {
    return (this.$cart.items.length > 0 ? false : true);
  };

  this.toObject = function() {
    if (this.getItems().length === 0) return false;
    var items = [];
    angular.forEach(this.getItems(), function(item) {
      items.push(item.toObject());
    });

    return {
      shipping: this.getShipping,
      promo: this.getPromo,
      canBuy: this.getStatusPay,
      subTotal: this.getSubTotal(),
      subTotalTax: this.getSubTotal(true),
      totalCost: this.totalCost(),
      totalCostTax: this.totalCost(true),
      items: items
    };
  };

  this.$restore = function(storedCart) {
    var _self = this;
    _self.init();
    _self.$cart.shipping = storedCart.shipping;
    _self.$cart.promo = storedCart.promo;
    _self.$cart.canBuy = storedCart.canBuy;

    angular.forEach(storedCart.items, function(item) {
      _self.$cart.items.push(new zlCartItem(item._id, item._name, item._price, item._tax, item._quantity, item._discount, item._data));
    });
    this.$save();
  };

  this.$save = function() {
    return zlStore.set('zlcart', JSON.stringify(this.getCart()));
  }
}])

.factory('zlCartItem', ['$rootScope', '$log', function($rootScope, $log) {
  var item = function(id, name, price, tax, quantity, discount, data) {
    this.setId(id);
    this.setName(name);
    this.setTax(tax);
    this.setPrice(price);
    this.setDiscount(discount);
    this.setQuantity(quantity);
    this.setData(data);
  };

  item.prototype.setId = function(id) {
    if (id) this._id = id;
    else {
      $log.error('An ID must be provided');
    }
  };

  item.prototype.getId = function() {
    return this._id;
  };

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

  item.prototype.getPrice = function(tax) {
    if (tax) {
      return this._price + (this._price / 100 * this._tax);
    } else {
      return this._price;
    }
  };

  item.prototype.getPriceWithDiscount = function(tax) {
    var priceFloat = (tax ? this.getPrice(tax) : this.getPrice());
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

  item.prototype.getTotal = function(tax) {
    return +parseFloat(this.getQuantity() * this.getPrice(tax)).toFixed(2);
  };

  item.prototype.getTotalWithDiscount = function(tax) {
    return +parseFloat(this.getQuantity() * this.getPriceWithDiscount(tax)).toFixed(2);
  };

  item.prototype.toObject = function() {
    return {
      id: this.getId(),
      name: this.getName(),
      price: this.getPrice(),
      priceWithTax: this.getPrice(true),
      priceWithDiscount: this.getPriceWithDiscount(),
      priceWithDiscountTax: this.getPriceWithDiscount(true),
      tax: this.getTax(),
      discount: this.getDiscount(),
      quantity: this.getQuantity(),
      data: this.getData(),
      total: this.getTotal(),
      totalWithTax: this.getTotal(true),
      totalWithDiscount: this.getTotalWithDiscount(),
      totalWithDiscountTax: this.getTotalWithDiscount(true)
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
    this.urlDiscount = null;
  };

  this.canApplyDiscount = function() {
    return (typeof this.urlDiscount !== 'undefined');
  }

  this.setUrlDiscount = function(url) {
    this.urlDiscount = url;
  };

  this.getUrlDiscount = function() {
    return this.urlDiscount;
  };

  this.setDiscount = function(code, restore, callback) {
    var cart = zlCart.getCart();
    $http.post(this.getUrlDiscount() + code, {
      cart: cart
    }).then(function(response) {
      if (response.data) {
        //zlCart.setPromo(response.data.promo);
        if (restore) { zlCart.$restore(angular.fromJson(response.data)); };
        zlCart.setStatusPay(true);
      }
      callback();
    }).catch(function(response) {
      if (restore) { zlCart.$restore(angular.fromJson(response.data.cart)); };
      zlCart.setStatusPay(false);
      callback(response.data.error);
    });
  };
}])

.controller('CartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.value('version', '1.0.19');