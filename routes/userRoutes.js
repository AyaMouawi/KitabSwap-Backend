const express = require('express');
const router = express.Router();

const {
    getAll,
    getById,
    updateUser,
    deleteById,
    login,
    register,
    getAddress,
    updateAddress
  } = require('../controllers/userController');

  const isAuthenticated = require('../middlewares/auth');

  router.get('/getAll', getAll);
  router.get('/getById/:userId', getById);
  router.put('/update/:userId', updateUser);
  router.delete('/delete/:userId',isAuthenticated(['admin']),deleteById);
  router.post('/login', login);
  router.post('/register', register);
  router.get('/getAddress/:userId', getAddress);
  router.put('/updateAddress/:userId',isAuthenticated(['client']), updateAddress);


  module.exports = router;