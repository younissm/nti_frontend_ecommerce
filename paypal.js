const PAYPAL_SANDBOX_CLIENT_ID = 'sb';
let paypalSdkPromise;

function renderPayPalButton(order, container, onCapture) {
    if (!['http:', 'https:'].includes(window.location.protocol)) {
        container.textContent = 'Open the app from a local web server to use PayPal.';
        return;
    }

    if (!PAYPAL_SANDBOX_CLIENT_ID || PAYPAL_SANDBOX_CLIENT_ID === 'YOUR_PAYPAL_SANDBOX_CLIENT_ID') {
        container.textContent = 'Add your PayPal Sandbox Client ID in paypal.js.';
        return;
    }

    loadPayPalSdk()
        .then(() => {
            if (!window.paypal || !window.paypal.Buttons) {
                throw new Error('PayPal Buttons did not load.');
            }

            window.paypal.Buttons({
                createOrder(data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            reference_id: order.id,
                            description: `Store order ${order.id}`,
                            amount: {
                                currency_code: 'USD',
                                value: order.total.toFixed(2)
                            }
                        }]
                    });
                },
                onApprove(data, actions) {
                    return actions.order.capture().then(details => {
                        const capture = details.purchase_units?.[0]?.payments?.captures?.find(
                            item => item.status === 'COMPLETED'
                        );
                        if (details.status !== 'COMPLETED' || !capture) {
                            throw new Error('PayPal did not confirm the payment.');
                        }

                        if (!onCapture(order.id, {
                            orderId: data.orderID,
                            captureId: capture.id
                        })) {
                            throw new Error('Payment went through, but the order could not be updated.');
                        }
                    });
                },
                onError(error) {
                    console.error('PayPal payment failed:', error);
                    const debugId = error.debug_id ? ` (Debug ID: ${error.debug_id})` : '';
                    container.textContent = `PayPal payment failed: ${error.message}${debugId}`;
                }
            }).render(container);
        })
        .catch(error => {
            container.textContent = `Could not load PayPal: ${error.message}`;
        });
}

function loadPayPalSdk() {
    if (!paypalSdkPromise) {
        paypalSdkPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_SANDBOX_CLIENT_ID)}&currency=USD&intent=capture`;
            script.onload = resolve;
            script.onerror = () => {
                paypalSdkPromise = null;
                reject(new Error('Check your Client ID and internet connection.'));
            };
            document.head.appendChild(script);
        });
    }

    return paypalSdkPromise;
}
