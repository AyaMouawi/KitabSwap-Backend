const express = require('express');
const router = express.Router();

const {
    getAll,
    getById,
    updateUser,
    deleteById
  } = require('../controllers/userController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getById/:userId', getById);
  router.put('/update/:userId', updateUser);
  router.delete('/delete/:userId',deleteById);

  module.exports = router;