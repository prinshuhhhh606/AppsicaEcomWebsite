const express = require('express');
const router = express.Router();
const { getAll, getBySlug } = require('../controllers/categoryController');

router.get('/', getAll);
router.get('/:slug', getBySlug);

module.exports = router;
