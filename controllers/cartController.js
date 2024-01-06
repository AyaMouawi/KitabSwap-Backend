const connection = require('../config/db');

const getByUser = async (req, res) => {
    const UserId = req.params.UserId;
    const query = `  WITH UserCartTotal AS (
                        SELECT
                        c.user_id,
                        SUM(c.total) AS cartTotalPrice
                        FROM
                        cart c
                        WHERE
                        c.user_id = ?
                        GROUP BY
                        c.user_id
                    )
                    SELECT
                        u.user_id,
                        CONCAT(u.firstName, ' ', u.lastName) AS userFullName,
                        JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'saleBook_id', c.saleBook_id,
                            'bookTitle', sb.title,
                            'quantity', c.quantity,
                            'total', c.total
                        )
                        ) AS books,
                        uct.cartTotalPrice
                    FROM
                        cart c
                    JOIN
                        users u ON c.user_id = u.user_id
                    JOIN
                        salebooks sb ON c.saleBook_id = sb.saleBook_id
                    JOIN
                        UserCartTotal uct ON c.user_id = uct.user_id
                    WHERE
                        c.user_id = ?
                    GROUP BY
                        u.user_id, u.firstName, u.lastName, uct.cartTotalPrice`;
    try {
      const [response] = await connection.query(query, [UserId, UserId]);

      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `cart with user id ${UserId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `cart with user id ${UserId} retrieved successfully.`,
        data: response,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve cart with user id ${UserId}.`,
        error: error.message,
      });
    }
  };

  
const deleteByUserId = async (req, res) => {
    const UserId = req.params.UserId;
    const query = `DELETE FROM cart WHERE user_id = ?;`;
    try {
      const [response] = await connection.query(query, [UserId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `cart with user id ${UserId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `cart with user id ${UserId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete cart with user Id ${UserId}`,
        error: error.message,
      });
    }
  };



const addToCart = async (req, res) => {
    const userId = req.params.UserId;
    const saleBookId = req.params.saleBookId;
    const quantity = 1;
    try {
      const [bookExist] = await connection.query('SELECT * FROM salebooks WHERE saleBook_id = ?', [saleBookId]);
      if (bookExist.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No sale book with id ${saleBookId} found.`,
        });
      }
  
      const [bookInStock] = await connection.query('SELECT * FROM salebooks WHERE saleBook_id = ? AND quantity > 0', [saleBookId]);
      if (bookInStock.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The book is out of stock.',
        });
      }
  
      const [existingCartItem] = await connection.query('SELECT * FROM cart WHERE user_id = ? AND saleBook_id = ?', [userId, saleBookId]);
      if (existingCartItem.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Product is already in your cart.',
        });
      }

      const bookPrice = bookInStock[0].price;
      const total = quantity * bookPrice;

      const addToCartQuery = 'INSERT INTO cart (user_id, saleBook_id, quantity, total) VALUES (?, ?, ?, ?)';
      await connection.query(addToCartQuery, [userId, saleBookId, quantity, total]);
  
      return res.status(201).json({
        success: true,
        message: 'Sale book added to the cart successfully.',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to add sale book to the cart.',
        error: error.message,
      });
    }
  };


  
const removeFromCart = async (req, res) => {
    const userId = req.params.UserId;
    const saleBookId = req.params.saleBookId;
  
    try {
      const [cartItem] = await connection.query('SELECT * FROM cart WHERE user_id = ? AND saleBook_id = ?', [userId, saleBookId]);
  
      if (cartItem.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Sale book with id ${saleBookId} not found in your cart`,
        });
      }

      const deleteCartItemQuery = 'DELETE FROM cart WHERE user_id = ? AND saleBook_id = ?';
      await connection.query(deleteCartItemQuery, [userId, saleBookId]);
  
      return res.status(200).json({
        success: true,
        message: `Sale book with id ${saleBookId} removed from your cart`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Unable to remove sale book from the cart.',
        error: error.message,
      });
    }
  };
  

  module.exports = { getByUser, deleteByUserId, addToCart, removeFromCart};