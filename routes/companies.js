// Routes relating to cmpanies

const express = require("express");
const db = require("../db");
const router = new express.Router();
const ExpressError = require("../expressError");

/** GET a list of companies / => [{code, name}, ...] */

router.get('', async (req, res, next) => {
    try {
      const results = await db.query(
          `SELECT code, name FROM companies`
      );
      return res.json({companies: results.rows})
    } catch(err){
      return next(err)
    }
  });

module.exports = router;