const connection = require('../config/db');
const {sendConfirmationCheckoutToUser, sendOrderNotificationToOwner} = require('../extra/sendEmails')

// const checkout = async (req, res) => {
//     const userId = req.params.userId;
  
//     try {
//       const [cartData] = await connection.query(
//         'SELECT saleBook_id, quantity, total FROM cart WHERE user_id = ?',
//         [userId]
//       );
  
//       if (cartData.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: 'Cart is empty for the given user.',
//         });
//       }
  
//       const totalPrice = cartData.reduce((sum, item) => sum + parseFloat(item.total), 0);
  
//       const orderInfo = cartData
//         .map(item => `(${item.saleBook_id}, ${item.quantity}, ${item.total})`)
//         .join(' _ ');
  
//       const [insertResponse] = await connection.query(
//         'INSERT INTO orders (user_id, total, status, orderInfo, shipmentMethod) VALUES (?, ?, ?, ?, ?)',
//         [userId, totalPrice, 'pending', orderInfo, 'delivery']
//       );
  
//       await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

//       sendConfirmationCheckoutToUser(userId, insertResponse.insertId, orderInfo, totalPrice);
//       sendOrderNotificationToOwner(userId, insertResponse.insertId, orderInfo, totalPrice);
  
//       return res.status(200).json({
//         success: true,
//         message: 'Order placed successfully.',
//         data: {
//           orderId: insertResponse.insertId,
//           userId: userId,
//           orderInfo: orderInfo,
//           totalPrice: totalPrice.toFixed(2), 
//           status: 'pending',
//           shipmentMethod: 'delivery',
//         },
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: 'Unable to complete the checkout process.',
//         error: error.message,
//       });
//     }
//   };


const checkout = async (req, res) => {
  const userId = req.params.userId;
  const { orderInfo, shipmentMethod = 'delivery' } = req.body;

  try {
      const [userData] = await connection.query(
          'SELECT * FROM users WHERE user_id = ?',
          [userId]
      );

      if (userData.length === 0) {
          return res.status(404).json({
              success: false,
              message: `User with id ${userId} not found.`,
          });
      }

      if (!Array.isArray(orderInfo) || orderInfo.length === 0 || !orderInfo.every(item => 'bookId' in item && 'quantity' in item)) {
          return res.status(400).json({
              success: false,
              message: 'Invalid orderInfo format. It should be an array of objects with "bookId" and "quantity".',
          });
      }

      const uniqueBookIds = [];
      for (const item of orderInfo) {
          if (uniqueBookIds.includes(item.bookId)) {
              return res.status(400).json({
                  success: false,
                  message: `Duplicate bookId ${item.bookId} found in orderInfo.`,
              });
          }
          uniqueBookIds.push(item.bookId);
      }

      let totalPrice = 0;
      for (const item of orderInfo) {
          const [bookData] = await connection.query(
              'SELECT * FROM salebooks WHERE saleBook_id = ?',
              [item.bookId]
          );

          if (bookData.length === 0) {
              return res.status(404).json({
                  success: false,
                  message: `Book with id ${item.bookId} not found.`,
              });
          }

          if (item.quantity > bookData[0].quantity) {
              return res.status(400).json({
                  success: false,
                  message: `Not enough quantity in stock for Book with id ${item.bookId}.`,
              });
          }

          totalPrice += item.quantity * bookData[0].price;
          item.totalPrice = (item.quantity * bookData[0].price).toFixed(2);
      }

      const formattedOrderInfo = orderInfo.map(item => ({
          bookId: item.bookId,
          quantity: item.quantity,
          totalPrice: parseFloat(item.totalPrice),
      }));

      const [insertResponse] = await connection.query(
          'INSERT INTO orders (user_id, total, status, orderInfo, shipmentMethod) VALUES (?, ?, ?, ?, ?)',
          [userId, totalPrice, 'pending', JSON.stringify(formattedOrderInfo), shipmentMethod]
      );

      for (const item of formattedOrderInfo) {
          await connection.query(
              'UPDATE salebooks SET quantity = quantity - ? WHERE saleBook_id = ?',
              [item.quantity, item.bookId]
          );
      }

      sendConfirmationCheckoutToUser(userId, insertResponse.insertId, formattedOrderInfo, totalPrice);
      sendOrderNotificationToOwner(userId, insertResponse.insertId, formattedOrderInfo, totalPrice);

      return res.status(200).json({
          success: true,
          message: 'Order placed successfully.',
          data: {
              orderId: insertResponse.insertId,
              userId: userId,
              orderInfo: formattedOrderInfo,
              totalPrice: totalPrice.toFixed(2),
              status: 'pending',
              shipmentMethod: shipmentMethod,
          },
      });
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Unable to complete the checkout process.',
          error: error.message,
      });
  }
};



  const deleteById = async (req, res) => {
    const orderId = req.params.orderId;
    const query = `DELETE FROM orders WHERE order_id = ?;`;
    try {
      const [response] = await connection.query(query, [orderId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `order with id ${orderId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `order with id ${orderId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete order with Id ${orderId}`,
        error: error.message,
      });
    }
  };



const editById = async (req, res) => {
    const orderId = req.params.orderId;
    const newStatus = 'delivered';
  
    try {
      const [orderData] = await connection.query(
        'SELECT * FROM orders WHERE order_id = ?',
        [orderId]
      );
  
      if (orderData.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Order with id ${orderId} not found.`,
        });
      }
  
      if (orderData[0].status === newStatus) {
        return res.status(400).json({
          success: false,
          message: `Order with id ${orderId} is already delivered.`,
        });
      }
  

      const updateQuery = 'UPDATE orders SET status = ? WHERE order_id = ?';
      await connection.query(updateQuery, [newStatus, orderId]);
  
      return res.status(200).json({
        success: true,
        message: `Order with id ${orderId} has been successfully updated to delivered.`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Unable to update order with id ${orderId}.`,
        error: error.message,
      });
    }
  };


  const getAll = async (req, res) => {
    try {
        const query = `
        SELECT 
            orders.*, 
            users.firstName as userFirstName,
            users.lastName as userLastName,
            users.email as userEmail,
            users.phoneNumber as userPhoneNumber,
            users.city as userCity,
            users.street as userStreet,
            users.building as userBuilding,
            users.floor as userFloor,
            orderInfo
        FROM orders
        LEFT JOIN users ON orders.user_id = users.user_id
        `;

        const [result] = await connection.query(query);

        const formattedResult = result.map(async (order) => {
            const orderInfo = JSON.parse(order.orderInfo);

            const orderDetails = orderInfo.map(async (item) => {
                const { bookId, quantity, totalPrice } = item;
                const [book] = await connection.query('SELECT title FROM salebooks WHERE saleBook_id = ?', [bookId]);
                const bookName = book.length > 0 ? book[0].title : null;
                return {
                    bookId,
                    bookName,
                    quantity,
                    totalPrice: parseFloat(totalPrice),  
                };
            });

            const resolvedOrderDetails = await Promise.all(orderDetails);

            const totalQuantity = resolvedOrderDetails.reduce((acc, item) => acc + item.quantity, 0);
            const totalQuty = totalQuantity +" "+ 'books'

            return {
                orderId: order.order_id,
                userId: order.user_id,
                total: order.total,
                totalQuty, 
                status: order.status,
                shipmentMethod: order.shipmentMethod,
                orderDate: formatDate(order.orderDate),
                userInfo: {
                    userName: `${order.userFirstName} ${order.userLastName}`.trim(),
                    userEmail: order.userEmail || '',
                    userPhoneNumber: order.userPhoneNumber || '',
                    userLocation: `${order.userCity}, ${order.userStreet}, ${order.userBuilding}, ${order.userFloor}`.trim(),
                },
                orderDetails: resolvedOrderDetails,
            };
        });

        const resolvedResult = await Promise.all(formattedResult);

        return res.status(200).json({
            success: true,
            data: resolvedResult,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to fetch orders data.',
            error: error.message,
        });
    }
};

const getById = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const query = `
        SELECT 
            orders.*, 
            users.firstName as userFirstName,
            users.lastName as userLastName,
            users.email as userEmail,
            users.phoneNumber as userPhoneNumber,
            users.city as userCity,
            users.street as userStreet,
            users.building as userBuilding,
            users.floor as userFloor,
            orderInfo
        FROM orders
        LEFT JOIN users ON orders.user_id = users.user_id
        WHERE orders.order_id = ?
        `;

        const [result] = await connection.query(query, [orderId]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.',
            });
        }

        const order = result[0];
        const orderInfo = JSON.parse(order.orderInfo);

        const orderDetails = orderInfo.map(async (item) => {
            const { bookId, quantity, totalPrice } = item;
            const [book] = await connection.query('SELECT title FROM salebooks WHERE saleBook_id = ?', [bookId]);
            const bookName = book.length > 0 ? book[0].title : null;
            return {
                bookId,
                bookName,
                quantity,
                totalPrice: parseFloat(totalPrice),  
            };
        });

        const resolvedOrderDetails = await Promise.all(orderDetails);

        const formattedOrder = {
            orderId: order.order_id,
            userId: order.user_id,
            total: order.total,
            status: order.status,
            shipmentMethod: order.shipmentMethod,
            orderDate: formatDate(order.orderDate),
            userInfo: {
                userName: `${order.userFirstName} ${order.userLastName}`.trim(),
                userEmail: order.userEmail || '',
                userPhoneNumber: order.userPhoneNumber || '',
                userLocation: `${order.userCity}, ${order.userStreet}, ${order.userBuilding}, ${order.userFloor}`.trim(),
            },
            orderDetails: resolvedOrderDetails,
        };

        return res.status(200).json({
            success: true,
            data: formattedOrder,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to fetch order data.',
            error: error.message,
        });
    }
};

  const formatDate = (date) => {
    try {
        const formattedDate = new Date(date).toISOString().split('T')[0];
        return formattedDate;
    } catch (error) {
        console.error('Error formatting date:', error);
        console.error('Invalid date:', date);
        return null;
    }
};

module.exports = { checkout, deleteById, editById, getAll, getById};