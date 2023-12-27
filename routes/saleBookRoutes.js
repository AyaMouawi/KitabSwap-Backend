const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    getAll,
    getById,
    getLatestBooks,
    deleteById,
    add,
    editById
    
  } = require('../controllers/saleBookController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getLatest', getLatestBooks);
  router.get('/getById/:saleBookId', getById);
  router.delete('/delete/:saleBookId', isAuthenticated(['admin']), deleteById);
  router.post('/add', upload.single('image') , isAuthenticated(['admin']), add );
  router.put('/update/:saleBookId', upload.single('image') , isAuthenticated(['admin']), editById)
 

  module.exports = router; 