require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Vercel / Serverless
// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Pooja Flower API running on http://localhost:${PORT}`);
  });
}

// Export Express app for Vercel
module.exports = app;

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});