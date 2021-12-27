app.controller('SubscriptionController', ['$scope', 'SubscriptionService', '$translate', 'ClientInfo', 'ToastService', 'BillingDetailsService',
    function($scope, SubscriptionService, $translate, ClientInfo, ToastService, BillingDetailsService) {

    $scope.activeSection = 0;
    $scope.message = {};

    $scope.billingDetailsService = BillingDetailsService;

    $scope.cancelSubscription = function () {
        if (confirm($translate.instant('CANCEL_SUBSCRIPTION') + '\n' + $scope.getCancelInfoText())) {
            SubscriptionService.cancelSubscription().then(function () {
                SubscriptionService.getSubscription().finally( function () {
                    ToastService.info($translate.instant('SUBSCRIPTION_CANCELED'));
                });
            }, function (reason) {
                $scope.message.data = $translate.instant('SUBSCRIPTION_CANCEL_ERROR');
            });
        }
    }

    function getActiveUntilFormattedExpirationDate() {
        if (!ClientInfo.subscription || !ClientInfo.subscription.lastPaymentDate) {
            return null;
        }
        var lastPaymentDate = new Date(ClientInfo.subscription.lastPaymentDate);

        switch (ClientInfo.subscription.cycle) {
            case "MONTH":
                return $scope.formatDate(new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1)));
                break;
            case "YEAR":
                return $scope.formatDate(new Date(lastPaymentDate.setFullYear(lastPaymentDate.getFullYear() + 1)));
                break;
            default:
                console.error("Unknown billing cycle: " + ClientInfo.subscription.cycle);
                return null;
        }
    }

    $scope.getPlanLabel = function () {

        if (!ClientInfo.subscription) {
            return '';
        }

        var planLabel = SubscriptionService.getSubscriptionPlanLevelName();
        var activeUntilFormatedExpirationDate = getActiveUntilFormattedExpirationDate();
                
        if (!ClientInfo.subscription.nextPaymentDate && activeUntilFormatedExpirationDate) {
            planLabel += ' (active until ' + activeUntilFormatedExpirationDate + ')';
        }
        
        return planLabel;
    }

    $scope.getCancelInfoText = function () {
        var activeUntilDate = getActiveUntilFormattedExpirationDate();
        if (!!activeUntilDate) {
            return 'If canceled, plan will remain active until ' + activeUntilDate + '.';
        }
        return '';
    }

    $scope.onPlanChoice = function(plan) {
        if (typeof android === 'undefined') {
            $scope.subscriptionService.plan = plan;
        } else {
            android.setUserAccessToken(ClientInfo.accessToken);
            android.onPlanChoice(plan);
        }
    }

    $scope.getSilverPlanPrice = function () {
        if (ClientInfo.isEuCountry()) {
            if (SubscriptionService.isCycleYear || SubscriptionService.isActiveCycleYear()) {
                return '13.5€';
            } else {
                return '15€';
            }
        } else {
            if (SubscriptionService.isCycleYear || SubscriptionService.isActiveCycleYear()) {
                return '$13.5';
            } else {
                return '$15';
            }
        }
    }

    $scope.getGoldPlanPrice = function () {
        if (ClientInfo.isEuCountry()) {
            if (SubscriptionService.isCycleYear || SubscriptionService.isActiveCycleYear()) {
                return '22.5€';
            } else {
                return '25€';
            }
        } else {
            if (SubscriptionService.isCycleYear || SubscriptionService.isActiveCycleYear()) {
                return '$22.5';
            } else {
                return '$25';
            }
        }
    }
}]);
