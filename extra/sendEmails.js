require('dotenv').config();
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


module.exports = {sendTradeRequestEmail, sendAcceptEmail, sendDeclineEmail};