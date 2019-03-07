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
        return res.json({invoices: results.rows});
    } catch(err) {
        return next(err);
    }
})

/* GET object on given invoice => 
{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */
router.get('/:id', async function(req, res, next){
    try {
        const result = await db.query(
            `SELECT id, amt, paid, add_date, paid_date, code, name, description
             FROM invoices 
             LEFT JOIN companies
                ON invoices.comp_code = companies.code
            WHERE id = $1`, [req.params.id]
        );
        
        const {id, amt, paid, add_date, paid_date, code, name, description} = result.rows[0];
        
        return res.json({id, amt, paid, add_date, paid_date, company: {code, name, description}});

    } catch(err){
        err = new ExpressError("Invoice ID could not be found", 404);
        next(err);
    }

})

module.exports = router