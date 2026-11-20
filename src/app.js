import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1', apiRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'TaskFlow API is running',
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
