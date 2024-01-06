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
  router.delete('/delete/:UserId', deleteByUserId);
  router.post('/addToCart/:UserId/:saleBookId', addToCart );
  router.delete('/removeFromCart/:UserId/:saleBookId', removeFromCart );
  

  module.exports = router; 