const multer = require("multer");

//Setting up storage (files wil be storedin 'uploads/' folder)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
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

console.log("Multer middleware loaded!");

module.exports = upload;