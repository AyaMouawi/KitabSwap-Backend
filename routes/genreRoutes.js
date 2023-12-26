const express = require('express');
const router = express.Router();

const {
    getAll,
    getById,
    editById,
    deleteById
  } = require('../controllers/genreController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getById/:genreId',getById);
  router.put('/update/:genreId',isAuthenticated(['admin']), editById);
  router.delete('/delete/:genreId', isAuthenticated(['admin']), deleteById)

  module.exports = router;