const dotenv = require('dotenv');

// Load .env first so all requires see correct process.env
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { logEmailConfigStatus } = require('./utils/email');

const app = express();

// Log email config status at startup (no secrets)
logEmailConfigStatus();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/invite', require('./routes/invite'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/balances', require('./routes/balances'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-splitter', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

module.exports = app;

