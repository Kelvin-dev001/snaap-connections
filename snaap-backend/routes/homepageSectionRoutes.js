const express = require("express");
const router = express.Router();
const HomepageSection = require("../models/homepageSection");
const requireAdmin = require("../middleware/requireAdmin");

// PUBLIC: Get all homepage sections
router.get("/", async (req, res) => {
  try {
    const sections = await HomepageSection.find().sort({ order: 1, createdAt: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch homepage sections" });
  }
});

// PUBLIC: Get one section by key
router.get("/:key", async (req, res) => {
  try {
    const section = await HomepageSection.findOne({ sectionKey: req.params.key });
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch section" });
  }
});

// PROTECTED: Create section
router.post("/", requireAdmin, async (req, res) => {
  try {
    const section = await HomepageSection.create(req.body);
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: "Failed to create section" });
  }
});

// PROTECTED: Update section
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const section = await HomepageSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: "Failed to update section" });
  }
});

// PROTECTED: Delete section
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await HomepageSection.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Failed to delete section" });
  }
});

module.exports = router;