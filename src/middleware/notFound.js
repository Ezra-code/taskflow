import createAppError from '../utils/appError.js';

const notFound = (req, res, next) => {
  next(createAppError(`Route ${req.originalUrl} not found`, 404));
};

export default notFound;
