require('dotenv').config();
const { initializeApp } = require('firebase/app');
const firebaseConfig = require('./config/firebase');

initializeApp(firebaseConfig);

const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const genreRoutes = require('./routes/genreRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const saleBookRoutes = require('./routes/saleBookRoutes');
const tradeBookRoutes = require('./routes/tradeBookRoutes');

const express = require('express');
const app = express();
const PORT = process.env.PORT;
require('./config/db');
app.use(bodyParser.json());
app.use(cors());

app.use('/user', userRoutes);
app.use('/genre', genreRoutes);
app.use('/banner', bannerRoutes);
app.use('/saleBook', saleBookRoutes);
app.use('/tradeBook', tradeBookRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
  });