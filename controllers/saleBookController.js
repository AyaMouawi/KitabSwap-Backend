const connection = require('../config/db');
const { FileUpload } = require("../extra/imageUploader");

const getAll = async (_, res) => {
  const query = `SELECT 
                  sb.*,
                  g.genreName,
                  sb.price AS originalPrice,
                  CASE
                    WHEN sb.discount IS NOT NULL AND sb.discount != 0.00 THEN sb.discount
                    ELSE '-'
                  END AS discount,
                  CASE
                    WHEN sb.discount IS NOT NULL AND sb.discount != 0.00 THEN ROUND(sb.price - (sb.price * (sb.discount / 100)), 2)
                    ELSE NULL
                  END AS discountedPrice
              FROM salebooks sb
              JOIN genres g ON sb.genre_id = g.genre_id`;

  try {
      const [response] = await connection.query(query);
      return res.status(200).json({
          success: true,
          message: `All Books retrieved successfully.`,
          data: response.map((item) => ({
              ...item,
              postDate: formatDate(item.postDate),
          })),
      });
  } catch (error) {
      return res.status(400).json({
          success: false,
          message: `Unable to retrieve all Books.`,
          error: error.message,
      });
  }
};


  const getById = async (req, res) => {
    const saleBookId = req.params.saleBookId;
    const query = `SELECT 
                    sb.*,
                    g.genreName,
                    sb.price AS originalPrice,
                    CASE
                    WHEN sb.discount IS NOT NULL AND sb.discount != 0.00 THEN ROUND(sb.price - (sb.price * (sb.discount / 100)), 2)
                    ELSE NULL
                    END AS discountedPrice
                FROM salebooks sb
                JOIN genres g ON sb.genre_id = g.genre_id
                WHERE sb.saleBook_id = ?`;
    try {
      const [response] = await connection.query(query, [saleBookId]);

      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `book with id ${saleBookId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `book with id ${saleBookId} retrieved successfully.`,
        data: response.map((item) => ({
          ...item,
          postDate: formatDate(item.postDate),
        })),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve book with id ${saleBookId}.`,
        error: error.message,
      });
    }
  };

  const getLatestBooks = async (_, res) => {
    const query = `
                    SELECT 
                        sb.*,
                        g.genreName,
                        sb.price AS originalPrice,
                        CASE
                        WHEN sb.discount IS NOT NULL AND sb.discount != 0.00 THEN ROUND(sb.price - (sb.price * (sb.discount / 100)), 2)
                        ELSE NULL
                        END AS discountedPrice
                    FROM salebooks sb
                    JOIN genres g ON sb.genre_id = g.genre_id
                    ORDER BY sb.postDate DESC
                    LIMIT 5
                    `;
    
    try {
      const [response] = await connection.query(query);
      return res.status(200).json({
        success: true,
        message: `Latest 5 Books retrieved successfully.`,
        data: response.map((item) => ({
          ...item,
          postDate: formatDate(item.postDate),
        })),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve the latest 5 Books.`,
        error: error.message,
      });
    }
  };

  const deleteById = async (req, res) => {
    const saleBookId = req.params.saleBookId;
    const query = `DELETE FROM saleBooks WHERE saleBook_id = ?;`;
    try {
      const [response] = await connection.query(query, [saleBookId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `book with id ${saleBookId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `book with id ${saleBookId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete book with Id ${saleBookId}`,
        error: error.message,
      });
    }
  };

  const add = async (req, res) => {
    try {
      const file = req.file; 
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an image for the book.',
        });
      }
  
      const imageUploadResult = await FileUpload(file);

      const { title, genre_id, authorName, price, quantity, description, discount } = req.body;
      const query = `
        INSERT INTO salebooks
        (title, genre_id, authorName, price, quantity, description, book_image, discount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const values = [title, genre_id, authorName, price, quantity, description, imageUploadResult.downloadURL, discount];
  
      const [response] = await connection.query(query, values);
  
      return res.status(201).json({
        success: true,
        message: 'Book added successfully.',
        data: {
          ...imageUploadResult,
          saleBook_id: response.insertId,
          title,
          genre_id,
          authorName,
          price,
          quantity,
          description,
          discount,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Unable to add the book.',
        error: error.message,
      });
    }
  };

  const editById = async (req, res) => {
    const saleBookId = req.params.saleBookId;
  
    try {
      const [checkResponse] = await connection.query('SELECT * FROM salebooks WHERE saleBook_id = ?', [saleBookId]);
  
      if (checkResponse.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Book with id ${saleBookId} not found.`,
        });
      }
  
      let imageDownloadURL = checkResponse[0].book_image; 
  
      if (req.file) {
        const file = req.file;
        const imageUploadResult = await FileUpload(file);
        imageDownloadURL = imageUploadResult.downloadURL;
      }
  
      const { title, genre_id, authorName, price, quantity, description, discount, status } = req.body;

      const setClauses = [];
      const updateValues = [];
  
      if (title !== undefined) {
        setClauses.push('title = ?');
        updateValues.push(title);
      }
  
      if (genre_id !== undefined) {
        setClauses.push('genre_id = ?');
        updateValues.push(genre_id);
      }
  
      if (authorName !== undefined) {
        setClauses.push('authorName = ?');
        updateValues.push(authorName);
      }
  
      if (price !== undefined) {
        setClauses.push('price = ?');
        updateValues.push(price);
      }
  
      if (quantity !== undefined) {
        setClauses.push('quantity = ?');
        updateValues.push(quantity);
      }
  
      if (description !== undefined) {
        setClauses.push('description = ?');
        updateValues.push(description);
      }
  
      if (imageDownloadURL !== undefined) {
        setClauses.push('book_image = ?');
        updateValues.push(imageDownloadURL);
      }
  
      if (discount !== undefined) {
        setClauses.push('discount = ?');
        updateValues.push(discount);
      }
  
      if (status !== undefined) {
        setClauses.push('status = ?');
        updateValues.push(status);
      }
  
      const updateQuery = `
        UPDATE salebooks
        SET
          ${setClauses.join(', ')}
        WHERE saleBook_id = ?
      `;
  
      updateValues.push(saleBookId);
  
      const [updateResponse] = await connection.query(updateQuery, updateValues);
  
      if (updateResponse.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: `Unable to update book with id ${saleBookId}.`,
        });
      }
  
      return res.status(200).json({
        success: true,
        message: `Book with id ${saleBookId} updated successfully.`,
        data: {
          saleBook_id: saleBookId,
          title,
          genre_id,
          authorName,
          price,
          quantity,
          description,
          book_image: imageDownloadURL,
          discount,
          status,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to update book with id ${saleBookId}.`,
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
  

  module.exports = { getAll, getById, getLatestBooks, deleteById, add, editById};