// Routes relating to companies

const express = require("express");
const db = require("../db");
const router = new express.Router();
const ExpressError = require("../expressError");

/** GET a list of companies / => [{code, name}, ...] */

router.get('', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT code, name FROM companies`);
      return res.json({companies: results.rows});
    } catch(err) {
      return next(err);
    }
  });


/** GET specific company by code / => {code, name, description} */
router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const compResults = await db.query(
            `SELECT code, name, description 
             FROM companies
             WHERE code=$1`, [code]);
        
        if (compResults.rowCount === 0){
          throw new ExpressError("Company cannot be found", 404);
        }

        const invResults = await db.query(
          `SELECT id FROM invoices WHERE comp_code = $1`,
          [code]);

        const company = compResults.rows[0];
        company.invoices = invResults.rows;

        return res.json({company});
    } catch(err) {
        return next(err);
    }
});

/** POST create a company / => {code, name, description} */
router.post('', async (req, res, next) => {
	try {
		
		const { code, name, description } = req.body;
		
		const result = await db.query(
			`INSERT INTO companies (code, name, description)
			 VALUES ($1, $2, $3)
			 RETURNING code, name, description`, [code, name, description]
		);

		return res.status(201).json(result.rows[0]);

	} catch(err) {
		let niceError = new ExpressError("Company name or code already exists/is missing", 409)
		return next(niceError);
	}
});

/** PATCH update a company / => {code, name, description} */
router.patch('/:code', async (req, res, next) => {
	try {
		const { name, description } = req.body;

		const result = await db.query(
			`UPDATE companies SET name=$1, description=$2
			 WHERE code=$3
			 RETURNING code, name, description`, [name, description, req.params.code]
		);

		if (result.rowCount === 0){
			throw new ExpressError("Company cannot be found", 404);
		}

		return res.json(result.rows[0]);

	} catch(err) {
		if (err.status !== 404){
			err = new ExpressError("Company name already exists", 409);
		}
		return next(err);
	}
})

/* DELETE a company / => {status: "deleted"} */
router.delete('/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            `DELETE FROM companies WHERE code = $1`,
            [req.params.code]);
        if (result.rowCount === 0){
            throw new ExpressError("Company could not be found", 404)
        }
        return res.json({status: "deleted"});
    } catch(err) {
		return next(err);
    }
});

module.exports = router;