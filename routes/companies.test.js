process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");
const request = require("supertest");
const ExpressError = require("../expressError");

let company;
let invoice;

beforeEach(async function () {
    let compResult = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ('Test1', 'Test1', 'Test1')
         RETURNING code, name, description`);
    company = compResult.rows[0];

    let invResult = await db.query(
        `INSERT INTO invoices (comp_code, amt)
         VALUES ('Test1', 50)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    invoice = invResult.rows[0];
});

afterEach(async function () {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async function () {
    await db.end();
});


/* GET a list of companies / => [{code, name}, ...] */
describe("GET /companies", async function () {
    test("Gets a list of 1 company", async function () {
        const response = await request(app).get(`/companies`);
        const { companies } = response.body;
        expect(response.statusCode).toEqual(200);
        expect(companies).toHaveLength(1);
        expect(companies[0]).toEqual({ code: company.code, name: company.name });
    });
});

/* GET a single company / => {code, name, description} */
describe("GET /companies/:code", async function () {
    test("Gets 1 company", async function () {
        const response = await request(app).get(`/companies/Test1`);
        console.log("response.body is:", response.body)

        const { ...compDetails } = company;

        const expected = { company: { ...compDetails, invoices: [{ id: invoice.id }] } }
        console.log("expected", expected)
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(expected);
    });

    test("responds with 404 if can't find company", async function () {
        const response = await request(app).get(`/companies/Test10000`);

        expect(response.statusCode).toEqual(404);
    })
});

/* CREATE a single company / => {code, name, description} */
describe("POST /companies", async function () {
    test("create 1 company", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({
                code: "Test2",
                name: "Test2",
                description: "Test2"
            });

        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({ code: "Test2", name: "Test2", description: "Test2" });
    });

    test("409 if company name/code exists", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({
                code: "Test1",
                name: "Test1",
                description: "Test2"
            });
        expect(response.statusCode).toEqual(409);
    });
});

/* PATCH to update a single company / => {code, name, description}  */
describe("Patch 1 company", async function () {
    test("Update 1 company", async function () {
        const response = await request(app)
            .patch(`/companies/Test1`)
            .send({
                name: "Test2",
                description: "Test2"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ code: "Test1", name: "Test2", description: "Test2" });
    });
    
    test("responds with 404 if can't find company", async function () {
        const response = await request(app).get(`/companies/Test10000`);

        expect(response.statusCode).toEqual(404);
    });


    test("response with 409 if company name is taken", async function () {
    
    await request(app)
        .post(`/companies`)
        .send({
            code: "Test2",
            name: "Test2",
            description: "Test2"
        });

    const response = await request(app)
        .patch(`/companies/Test1`)
        .send({
            name: "Test2",
            description: "Test2"
        });

    expect(response.statusCode).toEqual(409);
    });
});