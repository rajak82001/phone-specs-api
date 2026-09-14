const express = require("express");
const router = express.Router();

const indexController = require("../controllers/index");
const brandController = require("../controllers/brandController");
const specController = require("../controllers/specController");
const searchController = require("../controllers/searchController");
const miscController = require("../controllers/miscController");

router.get("/", indexController.index);
router.get("/brands", brandController.index);
router.get("/brands/:slug", brandController.show);
router.get("/search", searchController.index);
router.get("/latest", miscController.index);
router.get("/top-by-interest", miscController.topInterest);
router.get("/top-by-fans", miscController.topFans);
router.get("/:slug", specController.index);

module.exports = router;
