const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
    getAll,
    getHighlighted,
    getById,
    editById,
    deleteById,
    add
  } = require('../controllers/bannerController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getHighlighted',getHighlighted);
  router.get('/getById/:bannerId', getById);
  router.put('/update/:bannerId', isAuthenticated(['admin']), editById);
  router.delete('/delete/:bannerId', isAuthenticated(['admin']), deleteById);
  router.post('/add', upload.single('image') ,isAuthenticated(['admin']),add)
 

  module.exports = router;