const express = require('express');
const router = express.Router();

const {

    getByUser,
    deleteByUserId,
    addToCart,
    removeFromCart
   
    
  } = require('../controllers/cartController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getByUser/:UserId', getByUser);
  router.delete('/delete/:UserId',isAuthenticated(['admin']), deleteByUserId);
  router.post('/addToCart/:UserId/:saleBookId', isAuthenticated(['client']), addToCart );
  router.delete('/removeFromCart/:UserId/:saleBookId', isAuthenticated(['client']), removeFromCart );
  

  module.exports = router; 