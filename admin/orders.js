const ordersList = document.getElementById('orders-list');

document.getElementById('logout').addEventListener('click', logout);
renderOrders();

function renderOrders() {
    const orders = getOrders()
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

    ordersList.replaceChildren();

    if (orders.length === 0) {
        ordersList.textContent = 'No customer orders yet.';
        return;
    }

    orders.forEach(order => ordersList.appendChild(makeOrderCard(order)));
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

    const customer = document.createElement('p');
    customer.textContent = `${order.customer.name} (${order.customer.email})`;

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
    const payment = document.createElement('p');
    payment.textContent = `Payment: ${order.paymentStatus || 'unpaid'}`;

    heading.append(title, status);
    card.append(heading, customer, date, items, total, payment);

    if (order.returnStatus) {
        const returnStatus = document.createElement('p');
        returnStatus.className = 'return-status';
        returnStatus.textContent = `Return request: ${order.returnStatus} — ${order.returnReason}`;
        card.appendChild(returnStatus);
        if (order.returnStatus === 'pending') {
            const returnActions = document.createElement('div');
            returnActions.className = 'order-actions';
            returnActions.append(
                makeButton('Approve return', () => reviewReturn(order.id, 'approved')),
                makeButton('Reject return', () => reviewReturn(order.id, 'rejected'), true)
            );
            card.appendChild(returnActions);
        }
        if (order.returnStatus === 'approved' && order.paymentStatus === 'paid') {
            const note = document.createElement('p');
            note.className = 'return-note';
            note.textContent = 'PayPal refunds are not processed by this frontend-only demo.';
            card.appendChild(note);
        }
    }

    if (order.status === 'pending') {
        const actions = document.createElement('div');
        actions.className = 'order-actions';
        actions.append(
            makeButton('Confirm', () => updateOrderStatus(order.id, 'confirmed')),
            makeButton('Reject', () => updateOrderStatus(order.id, 'rejected'), true)
        );
        card.appendChild(actions);
    }

    return card;
}

function makeButton(label, onClick, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary
        ? 'projects-button projects-button-secondary'
        : 'projects-button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const order = orders.find(item => item.id === orderId);

    if (!order || order.status !== 'pending') {
        return;
    }

    if (status === 'rejected') {
        const products = getProducts();
        order.items.forEach(orderItem => {
            const product = products.find(item => item.id === orderItem.productId);
            if (product) {
                product.stockQuantity += orderItem.quantity;
            }
        });
        saveProducts(products);
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveOrders(orders);
    renderOrders();
}

function reviewReturn(orderId, status) {
    const error = updateOrderReturnStatus(orderId, status);
    if (error) {
        return;
    }
    renderOrders();
}
