require('dotenv').config();
const connection = require('../config/db');
const nodemailer = require('nodemailer');

const sendTradeRequestEmail = async (ownerEmail, userRequestedName, userEmail, phoneNumber, location, bookName, tradebookTitle) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ownerEmail,
            subject: 'New Trade Request',
            text: `User requested to trade the book with title "${bookName}" with your book "${tradebookTitle}".\n\n`
                + `User Details:\n`
                + `Full Name: ${userRequestedName}\n`
                + `Email: ${userEmail}\n`
                + `Phone Number: ${phoneNumber}\n`
                + `Location: ${location}\n`,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendAcceptEmail = async (ownerEmail, userRequestedName, bookName, ownerBookName, ownerPhoneNumber) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ownerEmail,
            subject: 'Trade Request Accepted',
            text: `The user "${userRequestedName}" has accepted your trade your book "${bookName}" with their book "${ownerBookName}".\n`
                + `Please feel free to contact them on their phone number: ${ownerPhoneNumber}`,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Acceptance Email sent');
    } catch (error) {
        console.error('Error sending acceptance email:', error);
    }
};

const sendDeclineEmail = async (ownerEmail, userRequestedName, bookName, ownerBookName) => {
    try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ownerEmail,
            subject: 'Trade Request Declined',
            text: `The user "${userRequestedName}" has declined your trade request for your book "${bookName}" with their book "${ownerBookName}".`,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Decline Email sent');
    } catch (error) {
        console.error('Error sending decline email:', error);
    }
};


const sendConfirmationCheckoutToUser = async (userId, orderId, orderInfo, totalPrice) => {
  try {
    const [userDetails] = await connection.query(
      'SELECT firstName, lastName, email FROM users WHERE user_id = ?',
      [userId]
    );

    const userName = `${userDetails[0].firstName} ${userDetails[0].lastName}`;
    const userEmail = userDetails[0].email;

    const booksDetails = await Promise.all(orderInfo.map(async (item) => {
      const [bookDetails] = await connection.query(
        'SELECT title FROM salebooks WHERE saleBook_id = ?',
        [item.bookId]
      );

      return {
        title: bookDetails[0].title,
        quantity: item.quantity,
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : 'N/A',
      };
    }));

    const [orderDetails] = await connection.query(
      'SELECT shipmentMethod FROM orders WHERE order_id = ?',
      [orderId]
    );

    const shipmentMethod = orderDetails[0].shipmentMethod || 'delivery';

    const totalWithDelivery = (parseFloat(totalPrice) + (shipmentMethod === 'delivery' ? 3 : 0)).toFixed(2);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Order Confirmation',
      text: `Thank you ${userName} for your Order,\n`
        + 'Your Order was made successfully\n\n'
        + 'Order Details:\n'
        + `Order ID: ${orderId}\n`
        + 'Order Info:\n'
        + booksDetails.map((item, index) => `${index + 1}- (${item.title}, ${item.quantity}, ${item.totalPrice})`).join('\n')
        + `\nShipment Method: ${shipmentMethod}\n`
        + `Total Price: ${totalWithDelivery} ${shipmentMethod === 'delivery' ? '(including $3 delivery cost)' : ''}\n`,
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Order Confirmation Email sent to user');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

const sendOrderNotificationToOwner = async (userId, orderId, orderInfo, totalPrice) => {
  try {
    const [userDetails] = await connection.query(
      'SELECT firstName, lastName, email, phoneNumber, city, street, building, floor FROM users WHERE user_id = ?',
      [userId]
    );

    const userName = `${userDetails[0].firstName} ${userDetails[0].lastName}`;
    const userEmail = userDetails[0].email;
    const userPhoneNumber = userDetails[0].phoneNumber;
    const userLocation = `${userDetails[0].city}, ${userDetails[0].street}, ${userDetails[0].building}, ${userDetails[0].floor}`;

    const booksDetails = await Promise.all(orderInfo.map(async (item) => {
      const [bookDetails] = await connection.query(
        'SELECT title FROM salebooks WHERE saleBook_id = ?',
        [item.bookId]
      );

      return {
        title: bookDetails[0].title,
        quantity: item.quantity,
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : 'N/A',
      };
    }));

    const [orderDetails] = await connection.query(
      'SELECT shipmentMethod FROM orders WHERE order_id = ?',
      [orderId]
    );

    const shipmentMethod = orderDetails[0].shipmentMethod || 'delivery';

    const totalWithDelivery = (parseFloat(totalPrice) + (shipmentMethod === 'delivery' ? 3 : 0)).toFixed(2);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Order Request',
      text: `The user ${userName} placed an Order,\n`
        + 'Order Details:\n'
        + `Order ID: ${orderId}\n`
        + 'Order Info:\n'
        + booksDetails.map((item, index) => `${index + 1}- (${item.title}, ${item.quantity}, ${item.totalPrice})`).join('\n')
        + `\nShipment Method: ${shipmentMethod}\n`
        + `Total Price: ${totalWithDelivery} ${shipmentMethod === 'delivery' ? '(including $3 delivery cost)' : ''}\n`
        + `User Details:\n`
        + `Email: ${userEmail}\n`
        + `Phone Number: ${userPhoneNumber}\n`
        + `Location: ${userLocation}\n`,
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Order Notification Email sent to owner');
  } catch (error) {
    console.error('Error sending order notification email:', error);
  }
};


module.exports = {sendTradeRequestEmail, sendAcceptEmail, sendDeclineEmail, sendConfirmationCheckoutToUser, sendOrderNotificationToOwner};