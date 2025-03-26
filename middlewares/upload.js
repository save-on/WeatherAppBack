const multer = require("multer");
const path = require('path');


//Setting up storage (files wil be storedin 'uploads/' folder)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        let uploadDir = path.join(__dirname, "..", "public", "uploads");

        if(req.originalUrl.startsWith('/api/packing-lists')) {
            uploadDir = path.join(uploadDir, 'packing-list-images');
        }
        cb(null, uploadDir);

    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

//File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

//Initializemulter with storage & file filter


const upload = multer({ 
    storage, fileFilter,
    limits: { fileSize: 100 * 1024 * 1024}
});

module.exports = upload;