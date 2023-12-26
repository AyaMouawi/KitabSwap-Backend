const connection = require('../config/db');

const getAll = async (_, res) => {
    const query = `SELECT * FROM banner`;
    try {
      const [response] = await connection.query(query);
      return res.status(200).json({
        success: true,
        message: `All banners retrieved successfully.`,
        data: response,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve all banners.`,
        error: error.message,
      });
    }
  };

  const getHighlighted = async(_,res)=>{
    const query = `SELECT * FROM banner WHERE highlight = 1`;

    try {
        const [response] = await connection.query(query);
  
        if (response.length === 0) {
          return res.status(404).json({
            success: false,
            message: `no banner is highlighted`,
          });
        }
  
        return res.status(200).json({
          success: true,
          message: `highlighted retrieved successfully.`,
          data: response,
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Unable to retrieve highlighted banner.`,
          error: error.message,
        });
      }
    };

    const getById = async (req, res) => {
      const bannerId = req.params.bannerId;
      const query = `SELECT * FROM banner WHERE banner_id =?`;
      try {
        const [response] = await connection.query(query, [bannerId]);
  
        if (response.length === 0) {
          return res.status(404).json({
            success: false,
            message: `banner with id ${bannerId} not found`,
          });
        }
  
        return res.status(200).json({
          success: true,
          message: `banner with id ${bannerId} retrieved successfully.`,
          data: response,
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Unable to retrieve banner with id ${bannerId}.`,
          error: error.message,
        });
      }
    };

    const editById = async (req, res) => {
      const bannerId = req.params.bannerId;
      const updates = [];
      const {
        content,
        buttonText,
        link,
        highlight,
      } = req.body;
    
      try {
        const [bannerCheck] = await connection.query(`SELECT * FROM banner WHERE banner_id = ?`, [bannerId]);
    
        if (bannerCheck.length === 0) {
          return res.status(404).json({
            success: false,
            message: `banner with id ${bannerId} not found`,
          });
        }
    
        if (content !== undefined) updates.push(`content = ?`);
        if (buttonText !== undefined) updates.push(`buttonText = ?`);
        if (link !== undefined) updates.push(`link = ?`);
        if (highlight !== undefined) updates.push(`highlight= ?`);
    
        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid fields to update.',
          });
        }
    
        const setClause = updates.join(', ');
  
        const result = await connection.query(
          `UPDATE banner 
           SET ${setClause} 
           WHERE banner_id = ?`,
          [...Object.values(req.body).filter(value => value !== undefined), bannerId]
      );
      
    
    
        if (result.affectedRows === 0) {
          return res.status(400).json({
            success: false,
            message: `No rows were updated for banner with id ${bannerId}`,
          });
        }
    
        res.status(200).json({
          success: true,
          message: 'Data updated successfully',
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: 'Unable to update data',
          error: error.message,
        });
      }
    };

    const deleteById = async (req, res) => {
      const bannerId = req.params.bannerId;
      const query = `DELETE FROM banner WHERE banner_id = ?;`;
      try {
        const [response] = await connection.query(query, [bannerId]);
        if (!response.affectedRows)
          return res.status(400).json({
            success: false,
            message: `banner with id ${bannerId} not found`,
          });
        return res.status(200).json({
          success: true,
          message: `banner with id ${bannerId} deleted successfully`,
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Unable to delete banner with Id ${bannerId}`,
          error: error.message,
        });
      }
    };
  

  module.exports = { getAll, getHighlighted, getById, editById, deleteById};