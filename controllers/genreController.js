const connection = require('../config/db');

const getAll = async (_, res) => {
  const query = `
    SELECT genres.*, 
           COUNT(salebooks.saleBook_id) AS saleBookCount,
           COUNT(tradebooks.tradeBook_id) AS tradeBookCount,
           CASE
             WHEN COUNT(DISTINCT salebooks.discount) = 1 THEN MAX(salebooks.discount)
             ELSE '-'
           END AS discount
    FROM genres
    LEFT JOIN salebooks ON genres.genre_id = salebooks.genre_id
    LEFT JOIN tradebooks ON genres.genre_id = tradebooks.genre_id
    GROUP BY genres.genre_id
  `;
  try {
    const [response] = await connection.query(query);
    return res.status(200).json({
      success: true,
      message: `All genres retrieved successfully.`,
      data: response,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Unable to retrieve all genres.`,
      error: error.message,
    });
  }
};



  const getById = async (req, res) => {
    const genreId = req.params.genreId;
    const query = `SELECT * FROM genres WHERE genre_id =?`;
    try {
      const [response] = await connection.query(query, [genreId]);

      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `genre with id ${genreId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `genre with id ${genreId} retrieved successfully.`,
        data: response,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve genre with id ${genreId}.`,
        error: error.message,
      });
    }
  };

  const editById = async (req, res) => {
    const genreId = req.params.genreId;
    const { genreName } = req.body;
    const query = `UPDATE genres SET genreName = ? WHERE genre_id = ?`;

    try {
        const [response] = await connection.query(query, [genreName, genreId]);

        if (!response.affectedRows)
            return res.status(400).json({
                success: false,
                message: `genre with id = ${genreId} not found.`,
            });

        return res.status(200).json({
            success: true,
            message: `genre updated successfully.`,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Error while trying to update genre with id ${genreId}.`,
            error: error.message,
        });
    }
};

const deleteById = async (req, res) => {
    const genreId = req.params.genreId;
    const query = `DELETE FROM genres WHERE genre_id = ?;`;
    try {
      const [response] = await connection.query(query, [genreId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `genre with id ${genreId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `genre with id ${genreId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete genre with Id ${genreId}`,
        error: error.message,
      });
    }
  };

  const add = async (req, res) => {
    
    const { genreName } = req.body;
    const checkQuery = `SELECT * FROM genres WHERE genreName = ?`;
    const insertQuery = `INSERT INTO genres (genreName) VALUES (?)`;
  
    try {
      const [checkResponse] = await connection.query(checkQuery, [genreName]);
  
      if (checkResponse.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Genre '${genreName}' already exists.`,
        });
      }

      const [insertResponse] = await connection.query(insertQuery, [genreName]);
  
      return res.status(201).json({
        success: true,
        message: `Genre '${genreName}' added successfully.`,
        data: { genreId: insertResponse.insertId, genreName },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to add genre '${genreName}'.`,
        error: error.message,
      });
    }
  };


  module.exports = { getAll, getById, editById, deleteById, add};