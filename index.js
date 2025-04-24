import express from "express";
import bodyParser from "body-parser";

// pg package allows us to interact with our database in postgreSQL
import pg from "pg";

// allows us to access our passwords and other sensitive variables from the .env file
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

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

// retrieve all of the rows/entries from the "visited_countries" table in the "world" database
db.query("SELECT * FROM visited_countries", (err, res) => {
  if (err) {
    // an error occured
    console.err("Error executing query: ", err.stack);
  } else {
    // visistedCountries now contains the rows from the 'visited_countries' table
    visitedCountries = res.rows;
  }
  // close the connection to the database
  db.end();
});

app.get("/", async (req, res) => {
  //Write your code here.
  console.log(`Default GET \'/\' route: visitedCountries = `, visitedCountries);
  // array that will get sent to the EJS file
  let countries = [];
  // clean up the data so that only the country codes will be sent to the EJS file (and not the id generated from postgreSQL)
  visitedCountries.forEach((val) => {
    countries.push(val.country_code);
  });

  console.log(`Default GET \'/\' route: countires = `, countries);

  // send the array with the cleaned up data to the ejs file
  res.render("index", {
    countries: countries,
    // line 374 in index.ejs expects a "total" values which holds the total number of countries in the array
    total: countries.length
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
