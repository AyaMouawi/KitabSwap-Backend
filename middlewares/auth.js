const jwt = require('jsonwebtoken');

const isAuthenticated = (roles) => {
  return (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
      return res
        .status(401)
        .json({
          message: "No authentication credentials, unable to check if authenticated",
        });
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({
          error: "Unable to access token",
          message: 'No token, unable to check if authenticated'
        });
    }

    try {
      const credentials = jwt.verify(token, process.env.JWT_SECRET);
      const hasAccess = roles.includes(credentials.role);
      if (!hasAccess)
        return res.status(400).json({
          success: false,
          message: "You are not authenticated",
        });
      next();
    } catch (error) {
      return res.status(401).json({ message: "Error occured" });
    }
  }
};
module.exports = isAuthenticated;