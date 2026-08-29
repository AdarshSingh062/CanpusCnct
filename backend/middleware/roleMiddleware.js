/**
 * Restricts a route to specific roles.
 * Usage: router.post('/', protect, authorize('faculty', 'superadmin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

/**
 * Allows the action if the requester owns the resource OR has one of the given roles.
 * `getOwnerId` extracts the owner's user id string from req (e.g. from a loaded doc on req.resource).
 */
const authorizeOwnerOrRoles = (getOwnerId, ...roles) => (req, res, next) => {
  const ownerId = getOwnerId(req);
  const isOwner = ownerId && req.user && ownerId.toString() === req.user._id.toString();
  const hasRole = req.user && roles.includes(req.user.role);
  if (!isOwner && !hasRole) {
    res.status(403);
    throw new Error('Not authorized to modify this resource');
  }
  next();
};

module.exports = { authorize, authorizeOwnerOrRoles };
