const jwt = require("jsonwebtoken");

// const jwtToken = process.env.JWT_TOKEN;

const handleAuthError = (res) => {
  return res.status(401).send({
    error:
      "Unauthorized, you must provide valid credentials to access this resource",
  });
};

const extractBearerToken = (authorization) =>
  authorization.replace("Bearer ", "");

const auth = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer")) {
    return handleAuthError(res);
  }

  const token = extractBearerToken(authorization);

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_TOKEN);
    req.user = payload;
  } catch (error) {
    return handleAuthError(res);
  }
  return next();
};

module.exports = auth;
