import { apiError } from "../utlis/apiError.js";

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new apiError(401, "User not authenticated"));

    // map to role names properly
    const userRoles = req.user.roles.map(r => r.role.name); // correct property
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return next(new apiError(403, "You do not have permission to perform this action"));
    }

    next();
  };
};

export { authorizeRoles };
