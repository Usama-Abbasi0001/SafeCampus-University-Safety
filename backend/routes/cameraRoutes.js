const express = require('express');
const router = express.Router();
const Camera = require('../models/Camera');

// GET all cameras
router.get('/', async (req, res) => {
  try {
    const cameras = await Camera.find().sort({ id: 1 });
    res.json(cameras);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new camera
router.post('/', async (req, res) => {
  const camera = new Camera(req.body);
  try {
    const newCamera = await camera.save();
    res.status(201).json(newCamera);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a camera (e.g. status)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Camera.findOneAndUpdate(
      { id: req.params.id }, 
      req.body, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seed data
router.post('/seed', async (req, res) => {
  try {
    await Camera.deleteMany({});
    await Camera.insertMany(req.body);
    res.status(201).json({ message: "Seed successful!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
