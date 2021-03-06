const express = require("express");
const router = express.Router();

// validators
const {
  categoryCreateValidator,
  categoryUpdateValidator,
} = require("../validators/category");
const { runValidation } = require("../validators");

// controllers
const { requireSignin } = require("../controllers/auth");
const {
  create,
  list,
  read,
  update,
  remove,
} = require("../controllers/category");

// routes
router.post("/category", categoryCreateValidator, create);

router.get("/categories", list);

router.post("/category/:slug", read);
router.get("/category/:slug", read);

router.put("/category/:slug", update);

router.delete("/category/:slug", remove);

module.exports = router;
