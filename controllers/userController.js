const connection = require('../config/db');
const bcrypt = require('bcrypt');
const { generateToken } = require('../extra/generateToken');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');

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
  
  const login = async (req, res) => {
    const { email, password } = req.body;
    const query = `
        SELECT 
            role,
            user_id as userId,
            CONCAT(firstName, ' ', lastName) as userFullName,
            CONCAT(city, ' ', street, ' ', building, ' ', floor) as userAddress,
            email,
            phoneNumber,
            role,
            password
        FROM users 
        WHERE email = ?;
    `;

    try {
        const [response] = await connection.query(query, [email]);

        if (!response.length)
            return res.status(400).json({
                success: false,
                message: `User with email ${email} not found`,
            });

        const validPassword = await bcrypt.compare(password, response[0].password);

        if (!validPassword)
            return res.status(400).json({
                success: false,
                message: `Entered password for email ${email} is wrong`,
            });

        const user = response[0];
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        if (!userCredential.user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: `Email not verified. We sent you a verification link via email. Please follow it.`,
            });
        }

        const { userId, userFullName, userAddress, role } = user;
        const token = generateToken(userId, role);

        res.status(200).json({
            success: true,
            message: `User with email ${email} logged in successfully`,
            userId: userId,
            role : role,
            userFullName: userFullName,
            userAddress: userAddress,
            token: token,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Unable to login for user with email ${email}`,
            error: error.message,
        });
    }
};

  
  const register = async (req, res) => {
    const { firstName, lastName, email, password, phoneNumber, floor, building, street, city, additionalDescription, role } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }
  
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Weak password. Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol.',
      });
    }
  
    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Phone number must be exactly 8 digits.',
      });
    }
  
    try {
      const [emailCheck] = await connection.query(`SELECT * FROM users WHERE email = ?`, [email]);
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: `User with email ${email} already exists`,
        });
      }
  
      const [phoneCheck] = await connection.query(`SELECT * FROM users WHERE phoneNumber = ?`, [phoneNumber]);
      if (phoneCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: `User with phone number ${phoneNumber} already exists`,
        });
      }

      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const query = `
        INSERT INTO users 
          (firstName, lastName, email, password, phoneNumber, floor, building, street, city, additionalDescription, role) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
  
      const [response] = await connection.query(query, [
        firstName,
        lastName,
        email,
        hashedPassword,
        phoneNumber,
        floor,
        building,
        street,
        city,
        additionalDescription,
        role || 'client',
      ]);
  
      const [data] = await connection.query('SELECT * FROM users WHERE user_id = ?', [response.insertId]);
  
      res.status(200).json({
        success: true,
        message: 'User registered successfully',
        data: data[0],
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Unable to register a new user',
        error: error.message,
      });
    }
  };
  
  
  


  module.exports = {getAll, getById, updateUser, deleteById, login, register}