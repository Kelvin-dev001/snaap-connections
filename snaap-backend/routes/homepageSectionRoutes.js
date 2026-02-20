const express = require("express");
const router = express.Router();
const HomepageSection = require("../models/homepageSection");
const requireAdmin = require("../middleware/requireAdmin");
const { upload } = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "homepage-sections",
        public_id: filename ? filename.split(".")[0] : undefined,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// PUBLIC: Get all homepage sections
router.get("/", async (req, res) => {
  try {
    const sections = await HomepageSection.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json(sections);
  } catch (err) {
    console.error("Homepage sections GET error:", err);
    res.status(500).json({ message: "Failed to fetch homepage sections" });
  }
});

// PUBLIC: Get one section by key
router.get("/:key", async (req, res) => {
  try {
    const section = await HomepageSection.findOne({ sectionKey: req.params.key }).lean();
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (err) {
    console.error("Homepage section GET by key error:", err);
    res.status(500).json({ message: "Failed to fetch section" });
  }
});

// PROTECTED: Create section (multipart)
router.post("/", requireAdmin, upload.any(), async (req, res) => {
  try {
    const filesMap = {};
    (req.files || []).forEach((file) => {
      filesMap[file.fieldname] = file;
    });

    const rawItems = req.body.items ? JSON.parse(req.body.items) : [];
    const items = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const file = filesMap[`itemImage_${i}`];

      let imageUrl = item.image || "";
      if (file?.buffer) {
        imageUrl = await uploadToCloudinary(file.buffer, file.originalname);
      }

      if (!imageUrl) {
        return res.status(400).json({ message: `Card #${i + 1} requires an image.` });
      }

      items.push({ ...item, image: imageUrl });
    }

    const section = await HomepageSection.create({
      sectionKey: req.body.sectionKey,
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      enabled: String(req.body.enabled) === "true",
      order: Number(req.body.order || 0),
      items,
    });

    res.status(201).json(section);
  } catch (err) {
    console.error("Homepage section CREATE error:", err);
    res.status(500).json({ message: "Failed to create section" });
  }
});

// PROTECTED: Update section (multipart)
router.put("/:id", requireAdmin, upload.any(), async (req, res) => {
  try {
    const filesMap = {};
    (req.files || []).forEach((file) => {
      filesMap[file.fieldname] = file;
    });

    const rawItems = req.body.items ? JSON.parse(req.body.items) : [];
    const items = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const file = filesMap[`itemImage_${i}`];

      let imageUrl = item.image || "";
      if (file?.buffer) {
        imageUrl = await uploadToCloudinary(file.buffer, file.originalname);
      }

      if (!imageUrl) {
        return res.status(400).json({ message: `Card #${i + 1} requires an image.` });
      }

      items.push({ ...item, image: imageUrl });
    }

    const section = await HomepageSection.findByIdAndUpdate(
      req.params.id,
      {
        sectionKey: req.body.sectionKey,
        title: req.body.title,
        subtitle: req.body.subtitle || "",
        enabled: String(req.body.enabled) === "true",
        order: Number(req.body.order || 0),
        items,
      },
      { new: true }
    );

    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (err) {
    console.error("Homepage section UPDATE error:", err);
    res.status(500).json({ message: "Failed to update section" });
  }
});

// PROTECTED: Delete section
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await HomepageSection.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Homepage section DELETE error:", err);
    res.status(500).json({ message: "Failed to delete section" });
  }
});

module.exports = router;