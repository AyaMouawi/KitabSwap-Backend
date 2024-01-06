const connection = require('../config/db');
const { FileUpload } = require("../extra/imageUploader");

const getAll = async (_, res) => {
    const query = `SELECT
                    tb.tradeBook_id,
                    tb.owner_id,
                    CONCAT(u.firstName, ' ', u.lastName) AS ownerFullName,
                    tb.title,
                    tb.authorName,
                    tb.genre_id,
                    g.genreName,
                    tb.description,
                    tb.bookImage,
                    tb.postDate
                FROM
                    tradebooks tb
                JOIN
                    genres g ON tb.genre_id = g.genre_id
                JOIN
                    users u ON tb.owner_id = u.user_id;`;
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

  const getByOwnerId = async (req, res) => {
    const ownerId = req.params.ownerId;
    const query = `SELECT
                    tb.tradeBook_id,
                    tb.owner_id,
                    CONCAT(u.firstName, ' ', u.lastName) AS ownerFullName,
                    tb.title,
                    tb.authorName,
                    tb.genre_id,
                    g.genreName,
                    tb.description,
                    tb.bookImage,
                    tb.postDate
                FROM
                    tradebooks tb
                JOIN
                    genres g ON tb.genre_id = g.genre_id
                JOIN
                    users u ON tb.owner_id = u.user_id
                WHERE
                    tb.owner_id = ?`;
    try {
      const [response] = await connection.query(query, [ownerId]);

      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `book with owner id ${ownerId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `book with owner id ${ownerId} retrieved successfully.`,
        data: response.map((item) => ({
          ...item,
          postDate: formatDate(item.postDate),
        })),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve book with owner id ${ownerId}.`,
        error: error.message,
      });
    }
  };

  const getById = async (req, res) => {
    const tradeBookId = req.params.tradeBookId;
    const query = `SELECT
                    tb.tradeBook_id,
                    tb.owner_id,
                    CONCAT(u.firstName, ' ', u.lastName) AS ownerFullName,
                    tb.title,
                    tb.authorName,
                    tb.genre_id,
                    g.genreName,
                    tb.description,
                    tb.bookImage,
                    tb.postDate
                FROM
                    tradebooks tb
                JOIN
                    genres g ON tb.genre_id = g.genre_id
                JOIN
                    users u ON tb.owner_id = u.user_id
                WHERE
                    tb.tradebook_id = ?`;
    try {
      const [response] = await connection.query(query, [tradeBookId]);

      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `book with id ${tradeBookId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `book with id ${tradeBookId} retrieved successfully.`,
        data: response.map((item) => ({
          ...item,
          postDate: formatDate(item.postDate),
        })),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve book with id ${tradeBookId}.`,
        error: error.message,
      });
    }
  };

  const deleteById = async (req, res) => {
    const tradeBookId = req.params.tradeBookId;
    const query = `DELETE FROM tradebooks WHERE tradebook_id = ?;`;
    try {
      const [response] = await connection.query(query, [tradeBookId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `book with id ${tradeBookId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `book with id ${tradeBookId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete book with Id ${tradeBookId}`,
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

      const {owner_id, title, authorName, genre_id, description } = req.body;
      const query = `
        INSERT INTO tradebooks
        (owner_id, title, authorName, genre_id, description , bookImage)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
  
      const values = [owner_id, title, authorName, genre_id, description , imageUploadResult.downloadURL];
  
      const [response] = await connection.query(query, values);
  
      return res.status(201).json({
        success: true,
        message: 'Book added successfully.',
        data: {
          ...imageUploadResult,
          tradeBook_id: response.insertId,
          owner_id,
          title,
          authorName,
          genre_id,
          description,
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
    const tradeBookId = req.params.tradeBookId;
  
    try {
      const [checkResponse] = await connection.query('SELECT * FROM tradebooks WHERE tradeBook_id = ?', [tradeBookId]);
  
      if (checkResponse.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Book with id ${tradeBookId} not found.`,
        });
      }
  
      let imageDownloadURL = checkResponse[0].bookImage; 
  
      if (req.file) {
        const file = req.file;
        const imageUploadResult = await FileUpload(file);
        imageDownloadURL = imageUploadResult.downloadURL;
      }
  
      const {owner_id, title, authorName, genre_id, description } = req.body;

      const setClauses = [];
      const updateValues = [];

      if (owner_id !== undefined) {
        setClauses.push('owner_id = ?');
        updateValues.push(owner_id);
      }
  
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
  

      if (description !== undefined) {
        setClauses.push('description = ?');
        updateValues.push(description);
      }
  
      if (imageDownloadURL !== undefined) {
        setClauses.push('bookImage = ?');
        updateValues.push(imageDownloadURL);
      }
  
  
      const updateQuery = `
        UPDATE tradebooks
        SET
          ${setClauses.join(', ')}
        WHERE tradeBook_id = ?
      `;
  
      updateValues.push(tradeBookId);
  
      const [updateResponse] = await connection.query(updateQuery, updateValues);
  
      if (updateResponse.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: `Unable to update book with id ${tradeBookId}.`,
        });
      }
  
      return res.status(200).json({
        success: true,
        message: `Book with id ${tradeBookId} updated successfully.`,
        data: {
          tradeBook_id: tradeBookId,
          owner_id,
          title,
          authorName,
          genre_id,
          description,
          bookImage: imageDownloadURL,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to update book with id ${tradeBookId}.`,
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

  module.exports = { getAll, getByOwnerId, getById, deleteById, add, editById };