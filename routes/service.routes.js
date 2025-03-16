const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

router.get('/dashboard', serviceController.getDashboardStats);

router.get('/', serviceController.getTiposServicio);

module.exports = router;
