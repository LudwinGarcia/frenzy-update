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
  $scope.PromotionDatabase = {};
  $scope.CouponDatabase = {};

  /* This scope will save all costumer and your count */
  $scope.CustomerArray;

  /* Variables que cuardaran el conteo de categories */
  $scope.countPromotion;
  $scope.countCoupon;

  $scope.updateCategory = function() {
    FrenzyApp.database().ref('AppCategory').once('value', function(categoryData) {
      for (var x in categoryData.val()) {
        $scope.countCoupon = 0;
        $scope.countPromotion = 0;
        for (var y in $scope.CustomerArray) {
          if (categoryData.val()[x]['CategoryName'] === $scope.CustomerArray[y]['categoryApp']) {
            $scope.countPromotion += $scope.CustomerArray[y]['countPromotion'];
            $scope.countCoupon += $scope.CustomerArray[y]['countCoupon'];
          }
        }

        FrenzyApp.database().ref('AppCategory/'+x).update({
             QuantityCoupon: $scope.countCoupon,
             QuantityPromotion: $scope.countPromotion
        })
      }
    }).then(function() {
      console.log("$$ Update Category Finished $$");
    })
  }

  $scope.updateCounts = function() {
    /* Llamamamos loas datos de customer y creamos el json que almancenara los conteos de proomos, cupones y el promedio */
    FrenzyDashboard.database().ref('Customer').once('value', function(customerData) {
      var dictionary = {};
      for (var i in customerData.val()) {
        dictionary[customerData.val()[i]['Name']] = {'countPromotion':0,'countCoupon':0,'average':0,'key':i,'categoryApp':customerData.val()[i]['CategoryApp']}
      }
      $scope.CustomerArray = dictionary;
    }).then(function() {
      /* Lllamamos los datos de promociones y los guardamos en un arreglo local */
      FrenzyApp.database().ref('Promotion').once('value', function(promotionData) {
        for (x in promotionData.val()) {
          if (promotionData.val()[x]['Status'] === true) {
            $scope.PromotionDatabase[x] = promotionData.val()[x];
          }
        }
      }).then(function() {
        /* Llamamos los datos de cupones y los guardamos en un arreglo local */
        FrenzyApp.database().ref('Coupon').once('value', function(couponData) {
          for (y in couponData.val()) {
            if (couponData.val()[y]['Status'] === true) {
              $scope.CouponDatabase[y] = couponData.val()[y];
            }
          }
        }).then(function() {
          /* Recorremos los datos del arreglo de customer para poder calcular los conteos y promedio */
          FrenzyDashboard.database().ref('Customer').once('value', function(customerData) {
            /* Recorremos los datos que se encuentran en firebase. */
            for (var i in customerData.val()) {
              /* Este for recorre coupones para poder contar cuantos cupones tiene cada cliente. */
              for (var x in $scope.CouponDatabase) {
                /* Verifica que el cupon pertenezca al cliente en la pocicion i del for principal */
                if ($scope.CouponDatabase[x]['Customer'][0] === customerData.val()[i]["Name"]) {
                  /* Verifica si es DirectDiscount porque sino no tiene un valor en dinero */
                  if ($scope.CouponDatabase[x]['TypeOfExchange'] === 'DirectDiscount') {
                      /* Actualiza el conteo dentro del arreglo de costumer para cupones */
                      $scope.CustomerArray[customerData.val()[i]["Name"]]['countCoupon'] += 1;
                      /* Se calcula el ahorro y se almacena en average */
                      $scope.CustomerArray[customerData.val()[i]["Name"]]['average'] += $scope.CouponDatabase[x]['CouponDiscount'];
                  } else {
                    /* Actualiza el conteo dentro del arreglo de costumer para cupones */
                    $scope.CustomerArray[customerData.val()[i]["Name"]]['countCoupon'] += 1;
                    /* Se calcula el ahorro y se almacena en average, es cero porque es descuento en porcentaje */
                    $scope.CustomerArray[customerData.val()[i]["Name"]]['average'] = 0;
                  }
                }
              }/* final for de cupones */

              /* Este for recorre promociones para ver cuantas promociones tiene cada cliente */
              for (var x in $scope.PromotionDatabase) {
                  /* Verifica que la promocion pertenezca al cliente en la pocicion i del for principal */
                  if ($scope.PromotionDatabase[x]['Customer'][0] === customerData.val()[i]["Name"]) {
                      /* Actualiza el conteo dentro del arreglo de costumer para promociones */
                      $scope.CustomerArray[customerData.val()[i]["Name"]]['countPromotion'] += 1
                      /* Se calcula el ahorro y se almacena en average */
                      $scope.CustomerArray[customerData.val()[i]["Name"]]['average'] += ($scope.PromotionDatabase[x]['BasePrice'] - $scope.PromotionDatabase[x]['PromotionalPrice'])
                  }
              } /* Final for de promos*/

            }/* Final for de customer en firebase */
            /* Este for recorre los costumer para calcular el promedio de ahorro */
            for (var y in $scope.CustomerArray) {
              if (isNaN($scope.CustomerArray[y]['average'])) {
                $scope.CustomerArray[y]['average'] = 0;
              } else {
                if ($scope.CustomerArray[y]['average'] != 0) {
                  var totalAverage = 0;
                  totalAverage = ($scope.CustomerArray[y]['average'] / ($scope.CustomerArray[y]['countCoupon'] + $scope.CustomerArray[y]['countPromotion']));
                  $scope.CustomerArray[y]['average'] = totalAverage.toFixed(2);
                } else {
                  $scope.CustomerArray[y]['average'] = 0;
                }
              }
            }/* Final for calculo de promedio  */
          }).then(function() {
            /* for que recorre CustomerArray local*/
            for (var y in $scope.CustomerArray) {
              /* Enviamos la llave para entrar a cada uno de los customer en firebase */
              FrenzyDashboard.database().ref('Customer/'+$scope.CustomerArray[y]['key']).update({
                AverageSaving: $scope.CustomerArray[y]['average'],
                QuantityCoupon: $scope.CustomerArray[y]['countCoupon'],
                QuantityPromotion: $scope.CustomerArray[y]['countPromotion'],
              })
            }
            console.log("## Update Finished ##");
            $scope.updateCategory();
          })
        });
      });
    });
  }

  $scope.shutdownPromotion = function() {
    /*  Tomamos la fecha actual de Guatemala */
    $scope.fechaActual = moment.tz('America/Guatemala').format('x');

    /* Llamamos las promociones que estan en firebase */
    FrenzyApp.database().ref('Promotion').once('value', function(promotionData) {

      /* Recorremos las promociones que estan en firebase */
      for (var z in promotionData.val()) {
        /* Convertimos la de finalizacion de las promociones que esta en firebase */
        var fechaFinal =  new Date(moment(promotionData.val()[z]['EndDate'], 'DD/MM/YYYY HH:mm:ss'));
        /* Convertimos la fecha a milisegundos */
        fechaFinal = moment(fechaFinal).format('x');

        /* verificamos si la fecha de finalizacion es mayor a la fecha Actual
          de ser asi la promocion tiene que estar activa. */
        if (fechaFinal > $scope.fechaActual) {
          /* Enviamos la llave para entrar a cada uno de las promociones en firebase y dar de alta la promo*/
          FrenzyApp.database().ref('Promotion/'+ z).update({
            Status: true
          })
        } else {
          /* Enviamos la llave para entrar a cada uno de las promociones en firebase y dar de baja la promo*/
          FrenzyApp.database().ref('Promotion/'+ z).update({
            Status: false
          })
        }
      }/* final for verificacion de EndDate */

      /* Recorremos las promociones que estan en firebase */
      for (var a in promotionData.val()) {
        /* Convertimos la de finalizacion de las promociones que esta en firebase */
        var fechaPublicacion =  new Date(moment(promotionData.val()[a]['PublicationDate'], 'DD/MM/YYYY HH:mm:ss'));
        /* Convertimos la fecha a milisegundos */
        fechaPublicacion = moment(fechaFinal).format('x');

        /* verificamos si la fecha de publicacion es mayor a la fecha Actual
          de ser asi la promocion tiene que estar activa. */
        if (fechaPublicacion > $scope.fechaActual) {
          /* Enviamos la llave para entrar a cada uno de las promociones en firebase y dar de alta la promo*/
          FrenzyApp.database().ref('Promotion/'+ z).update({
            Status: false
          })
        } else {
          /* Enviamos la llave para entrar a cada uno de las promociones en firebase y dar de baja la promo*/
          FrenzyApp.database().ref('Promotion/'+ z).update({
            Status: true
          })
        }
      }/* final for verificacion de PublicationDate */

    }).then(function() {
        console.log("XXX Shutdown Finished XXX");
        $scope.updateCounts();
    });
  }
}]);
