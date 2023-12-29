const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    getAll,
    getByOwnerId,
    getById,
    deleteById,
    add,
    editById
   
    
  } = require('../controllers/tradeBookController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getByOwner/:ownerId', getByOwnerId);
  router.get('/getById/:tradeBookId', getById);
  router.delete('/delete/:tradeBookId', isAuthenticated(['admin']), deleteById);
  router.post('/add', upload.single('image') , isAuthenticated(['admin']), add );
  router.put('/update/:tradeBookId', upload.single('image') , isAuthenticated(['admin']), editById)
  

  module.exports = router; 