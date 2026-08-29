/** Consistent success envelope: { success, message, data, pagination? } */
const sendSuccess = (res, statusCode, message, data = null, pagination = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

/** Builds { page, limit, total, totalPages } from a Mongoose count + query params. */
const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

module.exports = { sendSuccess, buildPagination };
