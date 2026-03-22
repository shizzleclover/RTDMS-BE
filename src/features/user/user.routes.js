const express = require('express');
const router = express.Router();
const { getUsers, getRiders, getUser } = require('./user.controller');
const { protect } = require('../../common/middleware/auth.middleware');
const { authorize } = require('../../common/middleware/role.middleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/riders', getRiders);
router.get('/:id', getUser);

module.exports = router;
