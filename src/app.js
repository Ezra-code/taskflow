import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import passport from "./config/passport.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(passport.initialize());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);;

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', apiRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'TaskFlow API is running',
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
