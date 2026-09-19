const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getUsers, getUserById, updateUser, suspendUser } = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/suspend', authorize('superadmin'), suspendUser);

module.exports = router;
