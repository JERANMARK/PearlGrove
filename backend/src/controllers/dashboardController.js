import prisma from '../config/database.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      activeProducts,
      outOfStock,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCategories,
      recentProducts,
      recentOrders
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.category.count(),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { name: true }
          }
        }
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCategories
      },
      recentProducts,
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};
