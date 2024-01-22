const connection = require('../config/db');

const getAnalytics = async (req, res) => {
    try {

      const [totals] = await connection.query(`
        SELECT 
          (SELECT COUNT(DISTINCT user_id) FROM users) AS TotalUsers,
          COUNT(order_id) AS TotalOrders,
          SUM(total) AS TotalSales
        FROM orders;
      `);

      const [ordersPerMonth] = await connection.query(`
        SELECT 
          MONTH(orderDate) AS Month,
          COUNT(order_id) AS OrdersCount
        FROM orders
        GROUP BY Month;
      `);

      const [bestSellerCategories] = await connection.query(`
      SELECT 
      g.genreName AS Category,
      COUNT(o.order_id) AS OrdersCount
        FROM genres g
        LEFT JOIN (
            SELECT
                DISTINCT o.order_id,
                JSON_UNQUOTE(JSON_EXTRACT(o.orderInfo, '$[*].bookId')) AS bookId
            FROM orders o
            WHERE o.orderInfo IS NOT NULL
            AND JSON_UNQUOTE(JSON_EXTRACT(o.orderInfo, '$[*].bookId')) IS NOT NULL
        ) o ON g.genre_id = JSON_UNQUOTE(JSON_EXTRACT(o.bookId, '$[0]'))
        GROUP BY g.genre_id
        ORDER BY OrdersCount DESC;
      `);
  
    
      const [tradePerMonth] = await connection.query(`
        SELECT 
          MONTH(postDate) AS Month,
          COUNT(tradeBook_id) AS TradesCount
        FROM tradebooks
        GROUP BY Month;
      `);
  
      const analyticsTable = {
        TotalUsers: totals[0].TotalUsers,
        TotalOrders: totals[0].TotalOrders,
        TotalSales: totals[0].TotalSales,
      };
  
      const ordersPerMonthData = ordersPerMonth.map((monthData) => monthData.OrdersCount);
      
      const bestSellerCategoriesData = {
        categories: bestSellerCategories.map((category) => category.Category),
        sellers: bestSellerCategories.map((category) => category.OrdersCount),
      };
  
      const tradePerMonthData = tradePerMonth.map((monthData) => monthData.TradesCount);
  
      const analyticsResult = {
        analyticTable: analyticsTable,
        ordersPerMonth: ordersPerMonthData,
        bestSellerCategories: bestSellerCategoriesData,
        tradePerMonth: tradePerMonthData,
      };
  
      res.status(200).json({
        success: true,
        message: 'Analytics data retrieved successfully',
        data: analyticsResult,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Unable to retrieve analytics data',
        error: error.message,
      });
    }
  };

  module.exports = {getAnalytics};