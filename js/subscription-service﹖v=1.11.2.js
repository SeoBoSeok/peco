app.service('SubscriptionService', ['$http', 'CutListCfg', 'ClientInfo', 'AuthService', '$q', '$window', 'ConfigurationProperties', 'BillingDetailsService',
    function($http, CutListCfg, ClientInfo, AuthService, $q, $window, ConfigurationProperties, BillingDetailsService) {

    const self = this;

    self.plan = null;
    self.selectedPlanId = null;
    self.isRequestInProgress = false;

    this.registerSubscription = function(data) {
        self.isRequestInProgress = true;
        const deferred = $q.defer();
        const subscriptionData = {id: data.subscriptionID, orderId: data.orderID, planId: self.selectedPlanId};

        $http({
            url: CutListCfg.localBaseUrl + '/subscriptions',
            method: 'POST',
            data: subscriptionData,
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            try {
                BillingDetailsService.postInvoiceCustomerDetail();
            } catch (e) {
                console.error("Error on PayPal subscription post processing:\n" + e.stack);
            }
            self.isRequestInProgress = false;
            deferred.resolve(response);
        }, function (result) {
            self.isRequestInProgress = false;
            console.error("Error registering PayPal subscription: " + JSON.stringify(result));
            deferred.reject(result);
        });

        return deferred.promise;
    };

    this.getSubscription = function() {
        const deferred = $q.defer();

        $http({
            url: CutListCfg.localBaseUrl + '/subscriptions?userId=' + encodeURIComponent(ClientInfo.email),
            method: 'GET',
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            if (self.isSubscriptionActive(ClientInfo.subscription) && !self.isSubscriptionActive(response.data)) {
                console.warn("Previous PayPal subscription status was set to active but received response otherwise");
            }
            ClientInfo.setSubscription(response.data);
            if (ClientInfo.hasActiveSubscription()) {
                console.info("Subscription is active: " + JSON.stringify(ClientInfo.subscription));
                if (typeof android !== 'undefined') {
                    android.setSubscriptionPlanLevel(ClientInfo.subscription.planLevel);
                }
            }

            deferred.resolve(response.data);
        }, function (reason) {
            if (reason && reason.status === 404) {
                if (ClientInfo.subscription) {
                    console.warn("Subscription info not found on server but had this on local storage: " + JSON.stringify(ClientInfo.subscription) + "\n" + JSON.stringify(reason));
                }
                ClientInfo.subscription = null;
                $window.localStorage.removeItem("subscription");
            } else {
                console.error("Error while fetching Subscription info. Relying on local storage data: " + JSON.stringify(ClientInfo.subscription) + "\n" + JSON.stringify(reason));
            }
            deferred.reject(reason);
        });

        return deferred.promise;
    };

    this.cancelSubscription = function () {
        self.isRequestInProgress = true;
        const deferred = $q.defer();
        $http({
            url: CutListCfg.localBaseUrl + '/subscriptions/' + ClientInfo.subscription.id,
            method: 'DELETE',
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            self.isRequestInProgress = false;
            console.info("Canceled PayPal subscription ["  + ClientInfo.subscription.id + "]");
            self.getSubscription();
            deferred.resolve(response);
        }, function (result) {
            self.isRequestInProgress = false;
            console.error("Error cancelling PayPal subscription: " + JSON.stringify(result));
            deferred.reject(result);
        });
        return deferred.promise;
    }

    this.isSubscriptionActive = function(subscription) {
        try {
            return subscription && subscription.planLevel > 0;
        } catch (e) {
            console.error("Error evaluating subscription status: " + e.stack);
            return true;
        }
    };

    this.getSubscriptionPlanLevelName = function() {
        switch (ClientInfo.subscription && ClientInfo.subscription.planLevel) {
            case 0:
                return "Free";
            case 1:
                return "Bronze";
            case 2:
                return "Silver";
            case 3:
                return "Gold";
            default:
                return null;
        }
    };

    this.getActiveSubscriptionPlanLevel = function() {
        if (!ClientInfo.subscription || !ClientInfo.subscription.planLevel) {
            return 0;
        } else {
            return ClientInfo.subscription.planLevel;
        }
    };

    this.getExecutionThreshold = function () {
        switch (self.getActiveSubscriptionPlanLevel()) {
            case 0:
                return ConfigurationProperties.execThreshold1;
            default:
                return null;
        }
    };

    this.isActiveCycleYear = function () {
        return !!ClientInfo.subscription && ClientInfo.subscription.cycle === 'YEAR';
    };
}]);
