const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
    },
    image: {
      url: String,
      key: String,
    },
    content: {
      type: String,
      min: 1,
      max: 2000000,
    },
    location: {
      type: String,
      min: 1,
      max: 2000000,
    },
    admission: {
      type: String,
      min: 1,
      max: 2000000,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
