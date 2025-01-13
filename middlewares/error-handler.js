module.exports = (err, req, res, next) => {
  console.error(err.message || err.stack);

  const statusCode = err.statusCode || 500;
  res
    .status(statusCode)
    .send({ message: err.message || "Internal Server Error" });
};
