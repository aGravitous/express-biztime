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
});

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
        
        const { code, name, description, ...invoiceDeets } = result.rows[0];

        return res.json({ invoice:{ ...invoiceDeets, company: {code, name, description} }});

    } catch(err){
        err = new ExpressError("Invoice ID could not be found", 404);
        return next(err);
    }
});

/* POST add an invoice {comp_code, amt} => 
{invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.post('', async function(req, res, next){
    try {
        if (+req.body.amt <= 0){
            throw new ExpressError("Amount must be a positive number", 400);
        }
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.comp_code, req.body.amt]
        );
        return res.status(201).json({invoice:result.rows[0]});

    } catch(err) {
        if (err.status !== 400){
            err = new ExpressError("Company code cannot be found", 404);
        }
        return next(err);
    }
});

/* PUT update an invoice {comp_code, amt} => 
{invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.put('/:id', async function(req, res, next){
    try {

        if (+req.body.amt <= 0){
            throw new ExpressError("Amount must be a postive number", 400);
        }

        const result = await db.query(
            `UPDATE invoices set amt=$1
             WHERE id=$2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.amt, req.params.id] 
        );

        if (result.rowCount === 0){
            throw new ExpressError("Invoice cannot be found", 404);
        }
        
        return res.json({invoice:result.rows[0]});

    } catch(err) {
        return next(err);
    }
});

/* DELETE deletes an invoice at id => {status: "deleted"}*/
router.delete('/:id', async function (req, res, next){
    try {

        const result = await db.query(
            `DELETE FROM invoices WHERE id = $1`,
            [req.params.id]);

        if (result.rowCount === 0){
            throw new ExpressError("Invoice could not be found", 404)
        }

        return res.json({status: "deleted"});

    } catch(err) {
        return next(err);
    }
});

module.exports = router
