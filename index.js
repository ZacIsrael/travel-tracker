import express from "express";
import bodyParser from "body-parser";

// pg package allows us to interact with our database in postgreSQL
import pg from "pg";

// allows us to access our passwords and other sensitive variables from the .env file
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

// name of the table in the postgreSQL database that stores the codes of the visited countries
const visitedCountriesTable = "visited_countries";

// Set EJS as the view engine
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// stores the countries that have been visted
let visitedCountries = [];

const db = new pg.Client({
  user: process.env.PG_USERNAME,
  host: "localhost",
  // access the "world" database in postgreSQL
  database: "world",
  password: process.env.PG_PASSWORD,
  port: 5432,
});

// connect to the "world" database
db.connect();

app.get("/", async (req, res) => {
  try {
    //Write your code here.
    console.log(
      `Default GET \'/\' route: visitedCountries = `,
      visitedCountries
    );
    // array that will get sent to the EJS file
    let countries = [];
    // retrieve all of the rows/entries from the "visited_countries" table in the "world" database
    let queryResult = await db.query("SELECT * FROM visited_countries");

    visitedCountries = queryResult.rows;

    // clean up the data so that only the country codes will be sent to the EJS file (and not the id generated from postgreSQL)
    visitedCountries.forEach((val) => {
      countries.push(val.country_code);
    });

    console.log(`Default GET \'/\' route: countires = `, countries);

    // send the array with the cleaned up data to the ejs file
    res.render("index", {
      countries: countries,
      // line 374 in index.ejs expects a "total" values which holds the total number of countries in the array
      total: countries.length,
    });
  } catch (err) {
    // an error occured
    console.error("Error executing query: ", err.stack);
    res.status(500).send("Internal Server Error.");
  }
});

// allows a user to add a country (code) that they have visited
app.post("/add", async (req, res) => {
  console.log("req.body, ", req.body);
  let countryToAddCode = req.body.country;
  // ensures that the code is in ALL caps because that's how they are stored in the visited_countries table
  countryToAddCode = countryToAddCode.toUpperCase();

  if (countryToAddCode.length !== 2) {
    console.error(
      `POST \'/add\' route: Country code must be 2 characters long. ${countryToAddCode} is NOT 2 characters long.`
    );
  } else {
    let addedCountry = await db.query(
      `INSERT INTO ${visitedCountriesTable} (country_code) VALUES (\'${countryToAddCode})\'`
    );
    console.log("addedCountry query result = ", addedCountry);
  }
});

// close the connection to the database
// db.end();
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
