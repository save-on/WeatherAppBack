const jwt = require("jsonwebtoken");

// const jwtToken = process.env.JWT_TOKEN;

const handleAuthError = (res, errorMsg = "Unauthorized") => {
  console.error("Auth Error: ", errorMsg);
  return res.status(401).send({
    error: errorMsg,
  });
};

const extractBearerToken = (authorization) =>
  authorization.replace("Bearer ", "");

const auth = (req, res, next) => {
  console.log("Auth middleware running...");
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer")) {
    return handleAuthError(res, "Authorization header missing or malformed.");
  }

  const token = extractBearerToken(authorization);
  console.log("Token extracted: ", token.substring(0, 20) + "...");

  //log secret key
  console.log("JWT_TOKEN from process.env: ", process.env.JWT_TOKEN);

  let payload;

  try {
    if (!process.env.JWT_TOKEN) {
      throw new Error(
        "JWT_TOKEN secret is not defined in environment variables."
      );
    }
    payload = jwt.verify(token, process.env.JWT_TOKEN);
    req.user = payload;
    console.log("Auth middleware: Token verified. Payload: ", payload);
  } catch (error) {
    console.error("JWT Verification Error: ", error.message);
    if (error.name === "JsonWebTokenError") {
      return handleAuthError(res, "Invalid Token");
    }
    if (error.name === "TokenExpiredError") {
      return handleAuthError(res, "Token expired");
    }
    return handleAuthError(res, `Authentication failed: ${error.message}`);
  }
  return next();
};

module.exports = auth;
