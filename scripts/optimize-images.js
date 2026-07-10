const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const bannersDir = path.join(publicDir, 'small banners');
const brandsDir = path.join(publicDir, 'brands');

async function optimizeImages() {
    console.log('Optimizing Rotating Banners...');
    if (fs.existsSync(bannersDir)) {
        const banners = fs.readdirSync(bannersDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        for (const file of banners) {
            const inputPath = path.join(bannersDir, file);
            const outputPath = path.join(bannersDir, file.replace(/\.(png|jpg)$/, '.webp'));
            await sharp(inputPath)
                .resize(400, 500, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(outputPath);
            console.log(`Optimized banner: ${file} -> ${path.basename(outputPath)}`);
        }
    } else {
        console.log(`Directory not found: ${bannersDir}`);
    }

    console.log('Optimizing Brand Logos...');
    if (fs.existsSync(brandsDir)) {
        const brands = fs.readdirSync(brandsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        for (const file of brands) {
            const inputPath = path.join(brandsDir, file);
            const outputPath = path.join(brandsDir, file.replace(/\.(png|jpg)$/, '.webp'));
            await sharp(inputPath)
                .resize(180, 90, { fit: 'inside' })
                .webp({ quality: 80 })
                .toFile(outputPath);
            console.log(`Optimized brand logo: ${file} -> ${path.basename(outputPath)}`);
        }
    } else {
        console.log(`Directory not found: ${brandsDir}`);
    }

    console.log('Optimizing Main Logos...');
    const logos = ['vedashi-logo.png', 'vedashi-logo-white.png'];
    for (const logo of logos) {
        const inputPath = path.join(publicDir, logo);
        if (fs.existsSync(inputPath)) {
            const outputPath = path.join(publicDir, logo.replace(/\.png$/, '.webp'));
            await sharp(inputPath)
                .resize({ width: 360, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(outputPath);
            console.log(`Optimized main logo: ${logo} -> ${path.basename(outputPath)}`);
        } else {
            console.log(`File not found: ${inputPath}`);
        }
    }
    console.log('Optimization complete.');
}

optimizeImages().catch(console.error);
