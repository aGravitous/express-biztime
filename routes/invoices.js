// Routes relating to invoices

const express = require("express");
const db = require("../db");
const router = new express.Router();
const ExpressError = require("../expressError");

/* GET all invoices => {invoices: [{id, comp_code}], ...} */
router.get('', async function(req, res, next){
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`);
        return res.json({invoices: results.rows})
    } catch(err) {
        return next(err)
    }
})


module.exports = router