const Category = require("../models/category");
const slugify = require("slugify");
const fs = require("fs");

const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

//s3 config

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not upload",
      });
    }
    // console.table({err, fields, files})
    const { name, content, location, admission } = fields;
    const { image } = files;

    const slug = slugify(name);
    let category = new Category({ name, content, slug, location, admission });

    if (image.size > 8000000) {
      return res.status(400).json({
        error: "Image should be less than 2mb",
      });
    }
    // upload image to s3
    const params = {
      Bucket: "fcwil",
      Key: `category/${uuidv4()}`,
      Body: fs.readFileSync(image.path),
      ACL: "public-read",
      ContentType: `image/jpg`,
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.status(400).json({ error: "Upload to s3 failed" });
      }
      console.log("AWS UPLOAD RES DATA", data);
      category.image.url = data.Location;
      category.image.key = data.Key;
      category.url = data.Location;
      //posted by

      //   category.postedBy = req.user._id;

      // save to db
      category.save((err, success) => {
        if (err) {
          console.log(err);
          res.status(400).json({ error: "Duplicate category" });
        }
        return res.json(success);
      });
    });
  });
};

exports.list = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Categories could not load",
      });
    }
    res.json(data);
  });
};
exports.read = (req, res) => {
  const { slug } = req.params;

  Category.findOne({ slug }).exec((err, category) => {
    if (err) {
      return res.status(400).json({
        error: "Could not load category",
      });
    }
    res.json(category);
  });
};

exports.update = (req, res) => {
  // let form = new formidable.IncomingForm();
  // form.parse(req, (err, fields, files) => {
  //   if (err) {
  //     return res.status(400).json({
  //       error: "Image could not upload",
  //     });
  //   }

  const { slug } = req.params;
  const { name, image, content } = req.body;
  // console.log(slug);

  Category.findOneAndUpdate({ slug }, { name, content }, { new: false }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: "Could not find category to update",
        });
      }
      console.log("UPDATED", updated);

      if (image) {
        // remove the existing image from s3 before uploading new/updated one
        const deleteParams = {
          Bucket: "fcwil",
          Key: `${updated.image.key}`,
        };

        s3.deleteObject(deleteParams, function (err, data) {
          if (err) console.log("S3 DELETE ERROR DUING UPDATE", err);
          else console.log("S3 DELETED DURING UPDATE", data); // deleted
        });

        // handle upload image
        const params = {
          Bucket: "fcwil",
          Key: `category/${uuidv4()}`,
          Body: fs.readFileSync(image.path),
          ACL: "public-read",
          ContentType: `image/jpg`,
        };

        s3.upload(params, (err, data) => {
          if (err) {
            console.log(err);
            res.status(400).json({ error: "Upload to s3 failed" });
          }
          console.log("AWS UPLOAD RES DATA", data);
          updated.image.url = data.Location;
          updated.image.key = data.Key;
          //posted by

          //   category.postedBy = req.user._id;

          // save to db
          category.save((err, success) => {
            if (err) {
              console.log(err);
              res.status(400).json({ error: "Duplicate category" });
            }
            return res.json(success);
          });
        });
      } else {
        res.json(updated);
      }
    }
  );
  // });
};

exports.remove = (req, res) => {
  const { slug } = req.params;
  console.log(slug);

  Category.findOneAndDelete({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Could not delete category",
      });
    }
    const deleteParams = {
      Bucket: "fcwil",
      Key: `${data.image.key}`,
    };

    s3.deleteObject(deleteParams, function (err, data) {
      if (err) console.log("S3 DELETE ERROR", err);
      else console.log("S3 DELETED", data); // deleted
    });

    res.json({
      message: "Category deleted successfully",
    });
  });
};
