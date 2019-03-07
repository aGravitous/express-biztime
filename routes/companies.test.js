process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");
const request = require("supertest");
const ExpressError = require("../expressError");

let company;
let invoice;

beforeEach(async function(){
    let compResult = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ('Test1', 'TestCompany', 'Small Testing Company')
         RETURNING code, name, description`);
    company = compResult.rows[0];

    let invResult = await db.query(
        `INSERT INTO invoices (comp_code, amt)
         VALUES ('Test1', 50)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    invoice = invResult.rows[0];
});

afterEach(async function(){
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll( async function(){
    await db.end();
});


/* GET a list of companies / => [{code, name}, ...] */
describe("GET /companies", async function() {
    test("Gets a list of 1 company", async function() {
      const response = await request(app).get(`/companies`);
      const { companies } = response.body;
      expect(response.statusCode).toEqual(200);
      expect(companies).toHaveLength(1);
      expect(companies[0]).toEqual({code: company.code, name: company.name});
    });
  });