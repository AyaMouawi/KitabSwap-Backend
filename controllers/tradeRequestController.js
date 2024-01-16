require('dotenv').config();
const {sendTradeRequestEmail, sendAcceptEmail, sendDeclineEmail} = require ('../extra/sendEmails')
const connection = require('../config/db');
const { FileUpload } = require("../extra/imageUploader");

const getAll = async (_, res) => {
    const query = `SELECT
                        tr.*,
                        CONCAT(u.firstName, ' ', u.lastName) AS userRequestedName
                    FROM
                        traderequests tr
                    JOIN
                        users u ON tr.userRequested_id = u.user_id`;
    try {
      const [response] = await connection.query(query);
      return res.status(200).json({
        success: true,
        message: `All Trading requests retrieved successfully.`,
        data: response.map((item) => ({
            ...item,
            requestDate: formatDate(item.requestDate),
          })),
        });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve all Trading requests.`,
        error: error.message,
      });
    }
  };


const getById = async (req, res) => {
    const tradeRequestId = req.params.tradeRequestId; 

    const query = `SELECT
                        tr.*,
                        CONCAT(u.firstName, ' ', u.lastName) AS userRequestedName
                    FROM
                        traderequests tr
                    JOIN
                        users u ON tr.userRequested_id = u.user_id
                    WHERE
                        tr.tradeRequest_id = ?`;
    try {
        const [response] = await connection.query(query, [tradeRequestId]); 

        if (response.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Request with id ${tradeRequestId} not found`,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Request with id ${tradeRequestId} retrieved successfully.`,
            data: response.map((item) => ({
                ...item,
                requestDate: formatDate(item.requestDate),
              })),
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Unable to retrieve Request with id ${tradeRequestId}.`,
            error: error.message,
        });
    }
};


const getByUser = async (req, res) => {
    const userRequestedId = req.params.userRequestedId; 

    const query = `SELECT
                        tr.*,
                        CONCAT(u.firstName, ' ', u.lastName) AS userRequestedName
                    FROM
                        traderequests tr
                    JOIN
                        users u ON tr.userRequested_id = u.user_id
                    WHERE
                        tr.userRequested_id = ?`;
    try {
        const [response] = await connection.query(query, [userRequestedId]); 

        if (response.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Request with user id ${userRequestedId} not found`,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Request with user id ${userRequestedId} retrieved successfully.`,
            data: response.map((item) => ({
                ...item,
                requestDate: formatDate(item.requestDate),
              })),
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Unable to retrieve Request with user id ${userRequestedId}.`,
            error: error.message,
        });
    }
};

const getByTradeBook = async (req, res) => {
    const tradeBookId = req.params.tradeBookId;
    const query = `SELECT
                        tr.*,
                        CONCAT(u.firstName, ' ', u.lastName) AS userRequestedName
                    FROM
                        traderequests tr
                    JOIN
                        users u ON tr.userRequested_id = u.user_id
                    WHERE
                        tr.tradeBook_id = ?`;
    try {
      const [response] = await connection.query(query, [tradeBookId]);

      if (response.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Request with trade book with id ${tradeBookId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: ` Request with trade book with id ${tradeBookId} retrieved successfully.`,
        data: response.map((item) => ({
            ...item,
            requestDate: formatDate(item.requestDate),
          })),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve Request with trade book with id ${tradeBookId}.`,
        error: error.message,
      });
    }
  };



  const RequestTrade = async (req, res) => {
    console.log('RequestTrade route ');
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an image for the book.',
            });
        }

        const { tradebook_id, userRequested_id, bookName, description, location } = req.body;

        const checkQuery = `
            SELECT tradeRequest_id
            FROM traderequests
            WHERE tradebook_id = ? AND userRequested_id = ?
        `;

        const checkValues = [tradebook_id, userRequested_id];
        const [checkResult] = await connection.query(checkQuery, checkValues);

        if (checkResult.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already sent a request for this book.',
            });
        }

        const imageUploadResult = await FileUpload(file);

        const insertQuery = `
            INSERT INTO traderequests
            (tradebook_id, userRequested_id, bookName, description, bookImage, location)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const insertValues = [tradebook_id, userRequested_id, bookName, description, imageUploadResult.downloadURL, location];

        const [response] = await connection.query(insertQuery, insertValues);

        const ownerQuery = `
            SELECT u.email AS ownerEmail, u.phoneNumber AS ownerPhoneNumber, CONCAT(u.firstName, ' ', u.lastName) AS ownerName, tb.title AS tradebookTitle
            FROM tradebooks tb
            JOIN users u ON tb.owner_id = u.user_id
            WHERE tb.tradeBook_id = ?
        `;
        const ownerValues = [tradebook_id];
        const [ownerResult] = await connection.query(ownerQuery, ownerValues);

        if (ownerResult.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Trade book not found',
            });
        }

        const { ownerEmail, ownerName, ownerPhoneNumber, tradebookTitle } = ownerResult[0];

        await sendTradeRequestEmail(ownerEmail, ownerName, ownerEmail, ownerPhoneNumber, req.body.location, bookName, tradebookTitle);

        console.log('After sendTradeRequestEmail');
        return res.status(201).json({
            success: true,
            message: 'Request sent successfully.',
            data: {
                ...imageUploadResult,
                tradeRequest_id: response.insertId,
                tradebook_id,
                userRequested_id,
                bookName,
                description,
                location,
            },
        });
    } catch (error) {
        console.error('Error in RequestTrade try block:', error);

        return res.status(400).json({
            success: false,
            message: 'Unable to send request',
            error: error.message,
            stack: error.stack,
        });
    }
};


const deleteById = async (req, res) => {
    const tradeRequestId = req.params.tradeRequestId;
    const query = `DELETE FROM traderequests WHERE tradeRequest_id = ?;`;
    try {
      const [response] = await connection.query(query, [tradeRequestId]);
      if (!response.affectedRows)
        return res.status(400).json({
          success: false,
          message: `Request with id ${tradeRequestId} not found`,
        });
      return res.status(200).json({
        success: true,
        message: `Request with id ${tradeRequestId} deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Unable to delete Request with Id ${tradeRequestId}`,
        error: error.message,
      });
    }
  };

  const acceptRequest = async (req, res) => {
    const tradeRequestId = req.params.tradeRequestId;
    const query = `UPDATE traderequests SET status = 'accepted' WHERE tradeRequest_id = ? AND status = 'pending';`;

    try {
        const [response] = await connection.query(query, [tradeRequestId]);

        if (!response.affectedRows) {
            return res.status(400).json({
                success: false,
                message: `Request with id ${tradeRequestId} not found or already accepted/declined.`,
            });
        }

        const requestDetailsQuery = `
            SELECT tr.*, CONCAT(u.firstName, ' ', u.lastName) AS userRequestedName, tb.title AS tradebookTitle
            FROM traderequests tr
            JOIN users u ON tr.userRequested_id = u.user_id
            JOIN tradebooks tb ON tr.tradebook_id = tb.tradeBook_id
            WHERE tr.tradeRequest_id = ?`;

        const [requestDetailsResponse] = await connection.query(requestDetailsQuery, [tradeRequestId]);

        const { userRequested_id, bookName, userRequestedName, tradebookTitle } = requestDetailsResponse[0];

        const ownerDetailsQuery = `SELECT * FROM users WHERE user_id = ?`;
        const [ownerDetailsResponse] = await connection.query(ownerDetailsQuery, [userRequested_id]);

        const { email: ownerEmail, phoneNumber } = ownerDetailsResponse[0];

        await sendAcceptEmail(ownerEmail, userRequestedName, bookName, tradebookTitle, phoneNumber);

        const deleteTradeBookQuery = `DELETE FROM tradebooks WHERE tradeBook_id = ?;`;
        await connection.query(deleteTradeBookQuery, [requestDetailsResponse[0].tradebook_id]);

        return res.status(200).json({
            success: true,
            message: `Request with id ${tradeRequestId} accepted successfully.`,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Unable to accept Request with id ${tradeRequestId}.`,
            error: error.message,
        });
    }
};


const declineRequest = async (req, res) => {
    const tradeRequestId = req.params.tradeRequestId;
    const query = `UPDATE traderequests SET status = 'declined' WHERE tradeRequest_id = ? AND status = 'pending';`;

    try {
        const [response] = await connection.query(query, [tradeRequestId]);

        if (!response.affectedRows) {
            return res.status(400).json({
                success: false,
                message: `Request with id ${tradeRequestId} not found or already accepted/declined.`,
            });
        }

        const requestDetailsQuery = `
            SELECT tr.*, CONCAT(u.firstName, ' ', u.lastName) AS userRequestedName, tb.title AS tradebookTitle
            FROM traderequests tr
            JOIN users u ON tr.userRequested_id = u.user_id
            JOIN tradebooks tb ON tr.tradebook_id = tb.tradeBook_id
            WHERE tr.tradeRequest_id = ?`;
        
        const [requestDetailsResponse] = await connection.query(requestDetailsQuery, [tradeRequestId]);

        const { userRequested_id, bookName, userRequestedName, tradebookTitle } = requestDetailsResponse[0];

        const ownerDetailsQuery = `SELECT * FROM users WHERE user_id = ?`;
        const [ownerDetailsResponse] = await connection.query(ownerDetailsQuery, [userRequested_id]);

        const { email: ownerEmail } = ownerDetailsResponse[0];

        await sendDeclineEmail(ownerEmail, userRequestedName, bookName, tradebookTitle);

        return res.status(200).json({
            success: true,
            message: `Request with id ${tradeRequestId} declined successfully.`,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Unable to decline Request with id ${tradeRequestId}.`,
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

  module.exports = {getAll, getById, deleteById, getByUser, getByTradeBook, RequestTrade, acceptRequest, declineRequest}