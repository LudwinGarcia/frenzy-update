var FrenzyAppConfig = {
 apiKey: "AIzaSyCCkqPKuZh8QtKM_tU2nFDAcjjzufcVX6c",
 authDomain: "frenzyapplication.firebaseapp.com",
 databaseURL: "https://frenzyapplication.firebaseio.com",
 storageBucket: "frenzyapplication.appspot.com",
};



var FrenzyDashboardConfig = {
 apiKey: "AIzaSyDIbQh6IA6D9HHhfogQUZP63omtjwzAiBA",
   authDomain: "frenzydashboard.firebaseapp.com",
   databaseURL: "https://frenzydashboard.firebaseio.com",
   storageBucket: "frenzydashboard.appspot.com",
};

var FrenzyApp =  firebase.initializeApp(FrenzyAppConfig);
var FrenzyDashboard = firebase.initializeApp(FrenzyDashboardConfig, "Secondary");

var UploadFrenzy = angular.module('UploadFrenzy',[]);

/* Controller to update data base */
UploadFrenzy.controller('UpdateDatabase', ['$scope', function($scope) {
  /*Variable that save promotion and coupons*/
  $scope.PromotionDatabase;
  $scope.CouponDatabase;

  /* This scope will save all costumer and your count */
  $scope.CoustomerArray;



  $scope.updateCounts = function() {
    /* Llamamamos loas datos de customer y creamos el json que almancenara los conteos de proomos, cupones y el promedio */
    FrenzyDashboard.database().ref('Customer').once('value', function(customerData) {
      var dictionary = {};
      for (var i in customerData.val()) {
        dictionary[customerData.val()[i]["Name"]] = {'countPromotion':0,'countCoupon':0,'average':0,'key':i}
      }
      $scope.CoustomerArray = dictionary;
    }).then(function() {
      /* Lllamamos los datos de promociones y los guardamos en un arreglo local */
      FrenzyApp.database().ref('Promotion').once('value', function(promotionData) {
        $scope.PromotionDatabase = promotionData.val();
      }).then(function() {
        /* Llamamos los datos de cupones y los guardamos en un arreglo local */
        FrenzyApp.database().ref('Coupon').once('value', function(couponData) {
          $scope.CouponDatabase = couponData.val();
        }).then(function() {
          /* Recorremos los datos del arreglo de customer para poder calcular los conteos y promedio */
          FrenzyDashboard.database().ref('Customer').once('value', function(customerData) {
            for (var i in customerData.val()) {

              /* Este for recorre coupones para poder contar cuantos cupones tiene cada cliente. */
              for (var x in $scope.CouponDatabase) {
                /* Verifica que el cupon pertenezca al cliente en la pocicion i del for principal */
                if ($scope.CouponDatabase[x]['Customer'][0] === customerData.val()[i]["Name"]) {
                  console.log("Entro igual nombre cupones");
                  if ($scope.CouponDatabase[x]['TypeOfExchange'] === 'DirectDiscount') {
                    console.log("Entro a DirectDiscount");
                    /* Actualiza el conteo dentro del arreglo de costumer para cupones */
                    $scope.CoustomerArray[customerData.val()[i]["Name"]]['countCoupon'] += 1
                    /* Se calcula el ahorro y se almacena en average */
                    $scope.CoustomerArray[customerData.val()[i]["Name"]]['average'] += $scope.CouponDatabase[x]['CouponDiscount']
                  }
                }
              }/* final for de cupones */

              /* Este for recorre promociones para ver cuantas promociones tiene cada cliente */
              for (var x in $scope.PromotionDatabase) {
                /* Verifica si la promocion esta activa */
                if ($scope.PromotionDatabase[x]['Status'] === true) {
                  /* Verifica que la promocion pertenezca al cliente en la pocicion i del for principal */
                  if ($scope.PromotionDatabase[x]['Customer'][0] === customerData.val()[i]["Name"]) {
                    /* Actualiza el conteo dentro del arreglo de costumer para promociones */
                    $scope.CoustomerArray[customerData.val()[i]["Name"]]['countPromotion'] += 1
                    /* Se calcula el ahorro y se almacena en average */
                    $scope.CoustomerArray[customerData.val()[i]["Name"]]['average'] += ($scope.PromotionDatabase[x]['BasePrice'] - $scope.PromotionDatabase[x]['PromotionalPrice'])
                  }
                }
              } /* Final for de promos*/

            }/* Final for de customer en firebase */
            /* Este for recorre los costumer para calcular el promedio de ahorro */
            for (var y in $scope.CoustomerArray) {
              if (isNaN($scope.CoustomerArray[y]['average'])) {
                $scope.CoustomerArray[y]['average'] = 0;
              } else {
                if ($scope.CoustomerArray[y]['average'] != 0) {
                  var totalAverage = 0;
                  totalAverage = ($scope.CoustomerArray[y]['average'] / ($scope.CoustomerArray[y]['countCoupon'] + $scope.CoustomerArray[y]['countPromotion']))
                  $scope.CoustomerArray[y]['average'] = totalAverage.toFixed(2);
                } else {
                  $scope.CoustomerArray[y]['average'] = 0;
                }
              }
            }/* Final for calculo de promedio  */
            console.log($scope.CoustomerArray);
          }).then(function() {
            /* for que recorre CustomerArray local*/
            for (var y in $scope.CoustomerArray) {
              /* Enviamos la llave para entrar a cada uno de los customer en firebase */
              FrenzyDashboard.database().ref('Customer/'+$scope.CoustomerArray[y]['key']).update({
                AverageSaving: $scope.CoustomerArray[y]['average'],
                QuantityCoupon: $scope.CoustomerArray[y]['countCoupon'],
                QuantityPromotion: $scope.CoustomerArray[y]['countPromotion'],
              }).then(function() {
                console.log("@@ Actualizo " + y + " @@");
              });
            }
            console.log("#### Terminado ####");
          })
        });
      });
    });
  }

}]);
