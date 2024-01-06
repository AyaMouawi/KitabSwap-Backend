const express = require('express');
const router = express.Router();

const {

   checkout,
   deleteById,
   editById,
   getAll,
   getById
    
  } = require('../controllers/orderController');

  const isAuthenticated = require('../middlewares/auth');

  router.post('/checkout/:userId',isAuthenticated(['client']), checkout);
  router.delete('/delete/:orderId', isAuthenticated(['admin']), deleteById);
  router.put('/update/:orderId', isAuthenticated(['admin']), editById);
  router.get('/getAll', getAll)
  router.get('/getById/:orderId', getById)
  

  module.exports = router; 