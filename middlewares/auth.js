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

  console.log("Headers received: ", req.headers);
  console.log("Authorization header: ", authorization);


  if (!authorization || !authorization.startsWith("Bearer")) {
    console.log("No valid Authorization header found.");
    return handleAuthError(res);
  }

  const token = extractBearerToken(authorization);
  console.log("Received Token: ", token);

  let payload;

  try {
    console.log("JWT_TOKEN (auth middleware):", process.env.JWT_TOKEN);
    payload = jwt.verify(token, process.env.JWT_TOKEN);
    console.log(process.env.JWT_TOKEN);
    console.log("Decoded Payload (JWT verified successfully): ", payload);
    req.user = payload;
  } catch (error) {
    console.error("JWT Verification Error:", error.name);
    console.error("JWT Verification Error Details:", error.message);
    return handleAuthError(res);
  }
  return next();
};

module.exports = auth;
