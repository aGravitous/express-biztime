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

/* GET a list 1 invoice / => [{id, comp_code}],, ...] */
describe("GET /invoices", async function () {
    test("Gets a list of 1 invoice", async function () {
        const response = await request(app).get(`/invoices`);
        const { invoices } = response.body;
        expect(response.statusCode).toEqual(200);
        expect(invoices).toHaveLength(1);
        expect(invoices[0]).toEqual({ id: invoice.id, comp_code: invoice.comp_code });
    });
});

/* GET a single invoice / => {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */
describe("GET /invoices/:id", async function () {
    test("Gets 1 invoice", async function () {
        const response = await request(app).get(`/invoices/${invoice.id}`);

  
        const expected = { invoice:{id: invoice.id,
                            amt: invoice.amt,
                            paid: invoice.paid,
                            add_date: invoice.add_date,
                            paid_date: invoice.paid_date,
                            company } }
      
        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify(expected));
    });

    test("responds with 404 if can't find company", async function () {
        const response = await request(app).get(`/companies/Test10000`);

        expect(response.statusCode).toEqual(404);
    });
});

/* CREATE a single invoice / => {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
describe("POST /invoices", async function () {
    test("create 1 invoice", async function () {
        const response = await request(app)
            .post('/invoices')
            .send({
                comp_code: "Test1",
                amt: 100
            });

        expect(response.statusCode).toEqual(201);
        expect(response.body.invoice.id).toEqual(invoice.id + 1);
        expect(response.body.invoice.comp_code).toEqual("Test1");
        expect(response.body.invoice.amt).toEqual(100)
    });

    test("400 code if amount is not positive", async function () {
        const response = await request(app)
            .post('/invoices')
            .send({
                comp_code: "Test1",
                amt: 0
            });
        expect(response.statusCode).toEqual(400);
    });

    test("404 code if company code can't be found", async function () {
        const response = await request(app)
            .post('/invoices')
            .send({
                comp_code: "Test10000000",
                amt: 100
            });
        expect(response.statusCode).toEqual(404);
    });
});

/* PUT to update a single invoice / => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}   */
describe("PATCH /invoices/:id", async function () {
    test("Update 1 invoice", async function () {

        const response = await request(app)
            .put(`/invoices/${invoice.id}`)
            .send({
                amt: 10000
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body.invoice.id).toEqual(invoice.id);
        expect(response.body.invoice.comp_code).toEqual("Test1");
        expect(response.body.invoice.amt).toEqual(10000)
    });
    
    test("responds with 400 if amt is not positive", async function () {
        const response = await request(app)
            .put(`/invoices/${invoice.id}`)
            .send({
                amt: 0
            });
        expect(response.statusCode).toEqual(400);
       
    });


    test("response with 404 if invoice cannot be found", async function () {
    
    const response = await request(app)
        .put(`/invoices/10000`)
        .send({
            amt: 10000
        });

    expect(response.statusCode).toEqual(404);
    });
});

/* DELETE a single invoice / => {status: "deleted"} */
describe("DELETE /invoices/:id", async function () {
    test("Deletes 1 invoice", async function () {
        const response = await request(app).delete(`/invoices/${invoice.id}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"});

        const getResponse = await request(app).get(`/invoices`);
        const { invoices } = getResponse.body;
        expect(getResponse.statusCode).toEqual(200);
        expect(invoices).toHaveLength(0);
    });

    test("responds with 404 if can't find invoice", async function () {
        const response = await request(app).delete(`/invoices/10000`);

        expect(response.statusCode).toEqual(404);
    });
});