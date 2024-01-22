const connection = require('../config/db');
const { FileUpload } = require('../extra/imageUploader');

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

    const add = async (req, res) => {
      const { content, buttonText, link } = req.body;
    
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Image file is required.',
        });
      }
    
      const validLinkFormat = isValidLink(link);
      if (!validLinkFormat) {
        return res.status(400).json({
          success: false,
          message: 'Invalid link format. Please provide a valid URL.',
        });
      }
    
      try {
        const fileUploadResponse = await FileUpload(req.file);
    
        const query = `INSERT INTO banner (content, buttonText, link, image) VALUES (?, ?, ?, ?)`;
        const [response] = await connection.query(query, [content, buttonText, link, fileUploadResponse.downloadURL]);
    
        return res.status(201).json({
          success: true,
          message: 'Banner added successfully.',
          data: {
            bannerId: response.insertId,
            content,
            buttonText,
            link,
            image: fileUploadResponse,
          },
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Unable to add banner.',
          error: error.message,
        });
      }
    };
    
    const isValidLink = (link) => {
      const urlRegex = /^(https?:\/\/)?([\w-]+\.+[\w-]+)+([/?].*)?$/;
      return urlRegex.test(link);
    };

    const Highlite = async (req, res) => {
      const bannerId = req.params.bannerId;
      const { highlight } = req.body;
    

      try {
        
        await connection.query('UPDATE banner SET highlight = 0');
    
        const result = await connection.query(
          'UPDATE banner SET highlight = ? WHERE banner_id = ?',
          [highlight || 1, bannerId]
        );
    
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: `Banner with id ${bannerId} not found`,
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


  module.exports = { getAll, getHighlighted, getById, editById, deleteById, add, Highlite};