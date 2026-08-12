const express = require("express");
const router = express.Router();
const HomepageSection = require("../models/homepageSection");
const requireAdmin = require("../middleware/requireAdmin");
const { upload } = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const { validateSection, HERO_SLIDER_PREFIX, MAX_HERO_SLIDES } = require("../utils/sectionValidation");

// Cheap pre-flight so an over-long hero payload is rejected before its images
// are streamed to Cloudinary — validateSection would catch it either way, but
// only after we'd paid for the uploads and orphaned them.
function heroCapExceeded(sectionKey, items) {
  return String(sectionKey || "").startsWith(HERO_SLIDER_PREFIX) && items.length > MAX_HERO_SLIDES;
}

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

// Resolve every card's artwork, uploading whatever files came in with the
// request. Shared by POST and PUT — they had identical copies of this loop and
// the P8 mobile companion would have made that a third.
//
// Returns { items } on success, or { error } carrying the 400 message.
async function resolveItemImages(rawItems, filesMap) {
  const items = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];

    let image = item.image || "";
    const file = filesMap[`itemImage_${i}`];
    if (file?.buffer) image = await uploadToCloudinary(file.buffer, file.originalname);
    if (!image) return { error: `Card #${i + 1} requires an image.` };

    // Optional. Only the hero sliders currently send one; every other section
    // stores "" and the storefront falls back to the wide artwork.
    let imageMobile = item.imageMobile || "";
    const mobileFile = filesMap[`itemImageMobile_${i}`];
    if (mobileFile?.buffer) {
      imageMobile = await uploadToCloudinary(mobileFile.buffer, mobileFile.originalname);
    }

    items.push({ ...item, image, imageMobile });
  }

  return { items };
}

// Best-effort: refresh the storefront homepage after a section change so a publish
// or expiry shows immediately instead of waiting for the 60s ISR window. No-ops
// unless FRONTEND_REVALIDATE_URL + REVALIDATE_TOKEN are set. Fire-and-forget — it
// never blocks or fails the write.
function triggerRevalidate() {
  const url = process.env.FRONTEND_REVALIDATE_URL;
  const token = process.env.REVALIDATE_TOKEN;
  if (!url || !token) return;
  Promise.resolve()
    .then(() => fetch(url, { method: "POST", headers: { "x-revalidate-token": token } }))
    .catch((e) => console.warn("Revalidate trigger failed:", e.message));
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

// PROTECTED: Validate a section payload WITHOUT saving. The admin form calls this
// to show resolved product counts and to block publishing a card that resolves to
// nothing. Expects application/json (NOT multipart).
router.post("/validate", requireAdmin, async (req, res) => {
  try {
    const { sectionKey, enabled, startsAt, endsAt, items } = req.body || {};
    const validation = await validateSection({ sectionKey, enabled, startsAt, endsAt, items: items || [] });
    res.json(validation);
  } catch (err) {
    console.error("Homepage section VALIDATE error:", err);
    res.status(500).json({ message: "Failed to validate section" });
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

    if (heroCapExceeded(req.body.sectionKey, rawItems)) {
      return res
        .status(400)
        .json({ message: `A hero slider can hold at most ${MAX_HERO_SLIDES} slides.` });
    }

    const resolved = await resolveItemImages(rawItems, filesMap);
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }
    const items = resolved.items;

    const enabled = String(req.body.enabled) === "true";
    const startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;
    const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;

    const validation = await validateSection({ sectionKey: req.body.sectionKey, enabled, startsAt, endsAt, items });
    if (!validation.ok) {
      return res.status(400).json({ message: "Section has validation errors.", validation });
    }

    const section = await HomepageSection.create({
      sectionKey: req.body.sectionKey,
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      enabled,
      order: Number(req.body.order || 0),
      startsAt,
      endsAt,
      items,
    });

    triggerRevalidate();
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

    if (heroCapExceeded(req.body.sectionKey, rawItems)) {
      return res
        .status(400)
        .json({ message: `A hero slider can hold at most ${MAX_HERO_SLIDES} slides.` });
    }

    const resolved = await resolveItemImages(rawItems, filesMap);
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }
    const items = resolved.items;

    const enabled = String(req.body.enabled) === "true";
    const startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;
    const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;

    const validation = await validateSection({ sectionKey: req.body.sectionKey, enabled, startsAt, endsAt, items });
    if (!validation.ok) {
      return res.status(400).json({ message: "Section has validation errors.", validation });
    }

    const section = await HomepageSection.findByIdAndUpdate(
      req.params.id,
      {
        sectionKey: req.body.sectionKey,
        title: req.body.title,
        subtitle: req.body.subtitle || "",
        enabled,
        order: Number(req.body.order || 0),
        startsAt,
        endsAt,
        items,
      },
      { new: true }
    );

    if (!section) return res.status(404).json({ message: "Section not found" });
    triggerRevalidate();
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
    triggerRevalidate();
    res.status(204).send();
  } catch (err) {
    console.error("Homepage section DELETE error:", err);
    res.status(500).json({ message: "Failed to delete section" });
  }
});

module.exports = router;