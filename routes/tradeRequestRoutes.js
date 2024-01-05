const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    getAll,
    getById,
    deleteById,
    getByUser,
    getByTradeBook,
    RequestTrade,
    declineRequest,
    acceptRequest

      
  } = require('../controllers/tradeRequestController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getById/:tradeRequestId', getById);
  router.get('/getByUser/:userRequestedId', getByUser);
  router.get('/getByTradeBook/:tradeBookId', getByTradeBook);
  router.post('/RequestTrade', upload.single('image') , isAuthenticated(['admin']), RequestTrade );
  router.delete('/delete/:tradeRequestId', isAuthenticated(['admin']), deleteById);
  router.put('/accept/:tradeRequestId', upload.single('image') , isAuthenticated(['admin']), acceptRequest);
  router.put('/decline/:tradeRequestId', upload.single('image') , isAuthenticated(['admin']), declineRequest)
  

  module.exports = router; 