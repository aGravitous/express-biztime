// Routes relating to cmpanies

const express = require("express");
const db = require("../db");
const router = new express.Router();
const ExpressError = require("../expressError");

/** GET a list of companies / => [{code, name}, ...] */

router.get('', async (req, res, next) => {
    try {
      const results = await db.query(
          `SELECT code, name FROM companies`);
      return res.json({companies: results.rows});
    } catch(err){
      return next(err)
    }
  });

module.exports = router;

router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code
        const results = await db.query(
            `SELECT code, name, description FROM companies
            WHERE code=$1`, [code]);
        return res.json({company: results.rows[0]});
    } catch(err){
        return next(err)
    }
});