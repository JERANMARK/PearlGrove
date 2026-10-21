const insufficientStock = (message) => Object.assign(new Error(message), { statusCode: 409 });

export const reserveOrderStock = async (tx, items, message = 'A product became unavailable or stock changed. Please review your order.') => {
  for (const item of items) {
    const reserved = await tx.product.updateMany({
      where: { id: item.productId, isAvailable: true, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (reserved.count !== 1) throw insufficientStock(message);
  }
};

export const releaseOrderStock = async (tx, items) => {
  for (const item of items) {
    if (!item.productId) continue;
    await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } }).catch((error) => {
      if (error.code !== 'P2025') throw error;
    });
  }
};

export const reconcileOrderStockForStatus = async (tx, order, nextStatus) => {
  if (order.status === nextStatus) return false;
  if (order.status !== 'CANCELLED' && nextStatus === 'CANCELLED') {
    await releaseOrderStock(tx, order.orderItems);
  } else if (order.status === 'CANCELLED' && nextStatus !== 'CANCELLED') {
    await reserveOrderStock(tx, order.orderItems, 'The order cannot be reopened because product stock is insufficient.');
  }
  return true;
};
