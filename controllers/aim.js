const Aim = require("../models/aim");
const Syllabus = require("../models/syllabus");
const formidable = require("formidable");
const slugify = require("slugify");
const { smartTrim } = require("../helpers/strand");
const { errorHandler } = require("../helpers/dbErrorHandler");

//variables from config
// const config = require("config");
// const appName = config.get("APP_NAME");
exports.aimById = (req, res, next, id) => {
  Aim.findById(id)
    .exec((err, aim) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      req.aim = aim;
      next();
    });
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields) => {
    const { differentiator, section, subject, title, body } = fields;

    if (!differentiator || differentiator.length === 0) {
      return res.status(400).json({
        error: "Ener a unique title for this syllabus",
      });
    }

    if (!title || title.length === 0) {
      return res.status(400).json({
        error: "A title is required for the introduction",
      });
    }
    if (!body || body.length === 0) {
      return res.status(400).json({
        error: "The introduction should have a body",
      });
    }

    let aim = new Aim();
    aim.differentiator = differentiator;
    aim.title = title;
    aim.subject = subject;
    aim.section = section;
    aim.body = body;

    aim.slug = slugify(differentiator).toLowerCase();

    aim.mtitle = `${differentiator}`;
    aim.excerpt = smartTrim(body, 400, " ", " ...");

    aim.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(result);
    });
  });
};

exports.list = (req, res) => {
  Aim.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

exports.read = (req, res) => {
  const aim = req.params.aim.toLowerCase();

  Aim.findOne({ aim }).exec((err, aim) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    Syllabus.find({ aim: aim })
      .populate("aim", "_id title mtitle excerpt aim body")
      .populate("rationale", "_id title mtitle excerpt rationale")
      .populate("introduction", "_id title mtitle excerpt introduction")
      .populate("subject", "_id name")
      .select("_id subject introduction aim rationale categories strands slug ")
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json({ aim, syllabus: data });
      });
  });
};


exports.remove = (req, res) => {
  const aim = req.params.aim.toLowerCase();
  Aim.findOneAndRemove({ aim }).exec((err, aim) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({ msg: "An aim is removed successfully" });
  });
};
