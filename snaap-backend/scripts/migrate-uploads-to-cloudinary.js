require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function uploadFileToCloudinary(localPath, filename) {
  const buffer = fs.readFileSync(localPath);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'products', public_id: filename.split('.')[0], resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const files = fs.readdirSync(UPLOADS_DIR);
  let totalUpdated = 0;

  for (const file of files) {
    const localPath = path.join(UPLOADS_DIR, file);
    if (!fs.lstatSync(localPath).isFile()) continue;

    // Only migrate image files
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) continue;

    console.log(`Uploading ${file} to Cloudinary...`);
    let cloudinaryUrl;
    try {
      cloudinaryUrl = await uploadFileToCloudinary(localPath, file);
      console.log(`Cloudinary URL: ${cloudinaryUrl}`);
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err);
      continue;
    }

    // Update all products referencing this image (in images or thumbnail)
    const localUrl = `/uploads/${file}`;
    const products = await Product.find({
      $or: [
        { images: localUrl },
        { thumbnail: localUrl },
      ]
    });

    if (products.length === 0) {
      console.log(`No product references found for ${file}`);
      continue;
    }

    for (const product of products) {
      let updated = false;

      // Update images array
      if (Array.isArray(product.images)) {
        const idx = product.images.indexOf(localUrl);
        if (idx !== -1) {
          product.images[idx] = cloudinaryUrl;
          updated = true;
        }
      }

      // Update thumbnail
      if (product.thumbnail === localUrl) {
        product.thumbnail = cloudinaryUrl;
        updated = true;
      }

      if (updated) {
        await product.save();
        totalUpdated++;
        console.log(`Updated product ${product._id} with new image URL`);
      }
    }
  }

  console.log(`Migration complete. Total products updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});