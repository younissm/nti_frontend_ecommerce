const ordersList = document.getElementById('orders-list');

document.getElementById('logout').addEventListener('click', logout);
renderOrders();

function renderOrders() {
    const customer = getCurrentUser();
    const orders = getOrders()
        .filter(order => order.customer.email === customer.email)
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

    ordersList.replaceChildren();

    if (orders.length === 0) {
        ordersList.textContent = 'You have not placed any orders yet.';
        return;
    }

    orders.forEach(order => {
        const card = makeOrderCard(order);
        ordersList.appendChild(card);
        addPaymentAndReturnControls(card, order);
    });
}

function makeOrderCard(order) {
    const card = document.createElement('article');
    card.className = 'order-card';

    const heading = document.createElement('div');
    heading.className = 'order-heading';

    const title = document.createElement('h2');
    title.textContent = `Order ${order.id}`;

    const status = document.createElement('span');
    status.className = `order-status order-status--${order.status}`;
    status.textContent = order.status;

    const date = document.createElement('p');
    date.className = 'order-date';
    date.textContent = `Placed ${new Date(order.createdAt).toLocaleString()}`;

    const items = document.createElement('ul');
    items.className = 'order-item-list';
    order.items.forEach(item => {
        const line = document.createElement('li');
        line.textContent = `${item.name} × ${item.quantity} — $${(item.price * item.quantity).toFixed(2)}`;
        items.appendChild(line);
    });

    const total = document.createElement('p');
    total.className = 'order-total';
    total.textContent = `Total: $${order.total.toFixed(2)}`;

    heading.append(title, status);
    card.append(heading, date, items, total);
    if (order.paymentStatus === 'paid') {
        const paymentStatus = document.createElement('p');
        paymentStatus.className = 'payment-status payment-status--paid';
        paymentStatus.textContent = 'Payment: Paid';
        card.appendChild(paymentStatus);
    } else if (order.status === 'confirmed') {
        const paymentStatus = document.createElement('p');
        paymentStatus.className = 'payment-status';
        paymentStatus.textContent = 'Payment: Awaiting payment';
        card.appendChild(paymentStatus);
    }
    return card;
}

function addPaymentAndReturnControls(card, order) {
    if (order.status === 'confirmed' && order.paymentStatus !== 'paid'
        && !['pending', 'approved'].includes(order.returnStatus)) {
        const payment = document.createElement('div');
        payment.className = 'paypal-payment';
        card.appendChild(payment);
        renderPayPalButton(order, payment, capturePayment);
    }

    if (order.returnStatus) {
        const returnStatus = document.createElement('p');
        returnStatus.className = 'return-status';
        returnStatus.textContent = `Return request: ${order.returnStatus} — ${order.returnReason}`;
        card.appendChild(returnStatus);
        if (order.returnStatus === 'approved' && order.paymentStatus === 'paid') {
            const refundNote = document.createElement('p');
            refundNote.className = 'return-note';
            refundNote.textContent = 'PayPal refunds are not processed by this frontend-only demo.';
            card.appendChild(refundNote);
        }
        return;
    }

    if (order.status === 'confirmed') {
        const form = document.createElement('form');
        form.className = 'return-form';
        const label = document.createElement('label');
        label.textContent = 'Request a return';
        const reason = document.createElement('textarea');
        reason.required = true;
        reason.maxLength = 300;
        reason.rows = 2;
        reason.placeholder = 'Why are you returning this order?';
        const message = document.createElement('p');
        message.className = 'form-message';
        message.hidden = true;
        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'projects-button projects-button-secondary';
        submit.textContent = 'Submit return request';
        label.appendChild(reason);
        form.append(label, message, submit);
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (!form.reportValidity()) {
                return;
            }
            const error = requestOrderReturn(order.id, reason.value);
            if (error) {
                message.textContent = error;
                message.hidden = false;
                return;
            }
            renderOrders();
        });
        card.appendChild(form);
    }
}

function capturePayment(orderId, capture) {
    const orders = getOrders();
    const order = orders.find(item => item.id === orderId);
    if (!order || order.status !== 'confirmed' || order.paymentStatus === 'paid' || order.returnStatus) {
        return false;
    }
    order.paymentStatus = 'paid';
    order.paypalOrderId = capture.orderId;
    order.paypalCaptureId = capture.captureId;
    order.paidAt = new Date().toISOString();
    saveOrders(orders);
    window.setTimeout(renderOrders, 0);
    return true;
}
