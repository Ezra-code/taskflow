const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || 'error',
    message:
      err.isOperational || process.env.NODE_ENV !== 'production'
        ? err.message
        : 'Something went wrong',
  });
};

export default errorHandler;
