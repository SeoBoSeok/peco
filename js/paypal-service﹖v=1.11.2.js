app.service('PayPalService', ['$timeout', 'ClientInfo', function($timeout, ClientInfo) {

    const self = this;

    const loadScript = function (url) {
        let htmlScriptElement = document.createElement('script');
        htmlScriptElement.setAttribute('src', url);
        htmlScriptElement.setAttribute('type', 'text/javascript');
        htmlScriptElement.async = false;
        document.getElementById('paypalScript').appendChild(htmlScriptElement);
    }

    self.loadPaypalScript = function () {
        try {
            let url = 'https://www.paypal.com/sdk/js?client-id=AUWgIeZnmTEHOqSkBqR9ewYXq5ZQ4nxTmT4ZOELJFwM04XTcid-Mj0MfjO_jmNB7bYdqMasRnLXz-7YS&vault=true&enable-funding=venmo';
            if (ClientInfo.isEuCountry()) {
                url += '&currency=EUR';
                console.info("Loading PayPal script with EUR currency...");
            } else {
                url += '&currency=USD';
                console.info("Loading PayPal script with USD currency...");
            }
            loadScript(url);
            loadScript("js/paypal-buttons.js?v=1.11.2");
        } catch (e) {
            console.error("Error loading PayPal script\n" + e.stack);
        }
    }

    $("#subscriptionModal").on('shown.bs.modal',function() {
        self.loadPaypalScript();
    });

}]);