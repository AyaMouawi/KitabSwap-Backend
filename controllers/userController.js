const connection = require('../config/db');
const bcrypt = require('bcrypt');
const { generateToken } = require('../extra/generateToken');

const getAll = async (_, res) => {
    const query = `SELECT 
                      user_id,
                      CONCAT(firstName, ' ', lastName) AS fullName,
                      email,
                      phoneNumber,
                      password,
                      CONCAT(IFNULL(floor, ''), ' ', IFNULL(building, ''), ' ', IFNULL(street, ''), ' ', IFNULL(city, '')) AS address,
                      additionalDescription,
                      role
                  FROM users;`;
    try {
      const [response] = await connection.query(query);
      return res.status(200).json({
        success: true,
        message: `All users retrieved successfully `,
        data: response,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to get all users`,
        error: error.message,
      });
    }
  };

  const getById = async (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT 
                    user_id,
                    CONCAT(firstName, ' ', lastName) AS fullName,
                    email,
                    phoneNumber,
                    password,
                    CONCAT(IFNULL(floor, ''), ' ', IFNULL(building, ''), ' ', IFNULL(street, ''), ' ', IFNULL(city, '')) AS address,
                    additionalDescription,
                    role
                  FROM users
                  WHERE user_id = ?;`;
    try {
      const [response] = await connection.query(query, [userId]);
  
      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `User with id ${userId} not found`,
        });
      }
  
      return res.status(200).json({
        success: true,
        message: `User with id ${userId} retrieved successfully `,
        data: response[0],
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to get user with id ${userId}`,
        error: error.message,
      });
    }
  };


  const updateUser = async (req, res) => {
    const userId = req.params.userId;
    const updates = [];
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      floor,
      building,
      street,
      city,
      additionalDescription,
      role,
    } = req.body;
  
    try {
      const [userCheck] = await connection.query(`SELECT * FROM users WHERE user_id = ?`, [userId]);
  
      if (userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: `User with id ${userId} not found`,
        });
      }
  
      if (firstName !== undefined) updates.push(`firstName = ?`);
      if (lastName !== undefined) updates.push(`lastName = ?`);
      if (email !== undefined) updates.push(`email = ?`);
      if (phoneNumber !== undefined) updates.push(`phoneNumber = ?`);
      if (password !== undefined) updates.push(`password = ?`);
      if (floor !== undefined) updates.push(`floor = ?`);
      if (building !== undefined) updates.push(`building = ?`);
      if (street !== undefined) updates.push(`street = ?`);
      if (city !== undefined) updates.push(`city = ?`);
      if (additionalDescription !== undefined) updates.push(`additionalDescription = ?`);
      if (role !== undefined) updates.push(`role = ?`);
  
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update.',
        });
      }
  
      const setClause = updates.join(', ');

      const result = await connection.query(
        `UPDATE users 
         SET ${setClause} 
         WHERE user_id = ?`,
        [...Object.values(req.body).filter(value => value !== undefined), userId]
      );
  
      console.log(result);
  
      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: `No rows were updated for user with id ${userId}`,
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
    const userId = req.params.userId;
    const query = `DELETE FROM users WHERE user_id = ?;`;
    try {
      const [response] = await connection.query(query, [userId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `User with Id ${userId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `User with Id ${userId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete user with Id ${userId}`,
        error: error.message,
      });
    }
  };
  
  
  


  module.exports = {getAll, getById, updateUser, deleteById}