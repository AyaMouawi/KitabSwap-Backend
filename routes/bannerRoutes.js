const express = require('express');
const router = express.Router();

const {
    getAll,
    getHighlighted,
    getById,
    editById,
    deleteById
  } = require('../controllers/bannerController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getHighlighted',getHighlighted);
  router.get('/getById/:bannerId', getById);
  router.put('/update/:bannerId', isAuthenticated(['admin']), editById);
  router.delete('/delete/:bannerId', isAuthenticated(['admin']), deleteById)
 

  module.exports = router;