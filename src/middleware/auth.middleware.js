import jwt from 'jsonwebtoken';
import createAppError from '../utils/appError.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createAppError('Authentication required', 401));
  }

  const token = authHeader.split(' ')[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return next(createAppError('Invalid or expired access token', 401));
  }

  req.user = {
    id: decoded.sub,
  };

  next();
};

export default authMiddleware;
