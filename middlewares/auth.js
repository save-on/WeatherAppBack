const jwt = require("jsonwebtoken");

const jwtToken = process.env.JWT_TOKEN;

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

  console.log("Headers received: ", req.headers);
  console.log("Authorization header: ", authorization);

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return handleAuthError(res);
  }

  const token = extractBearerToken(authorization);
  console.log("Received Token: ", token);

  let payload;

  try {
    payload = jwt.verify(token, jwtToken);
    req.user = payload;
  } catch (error) {
    console.error(error);
    return handleAuthError(res);
  }
  return next();
};

module.exports = auth;
