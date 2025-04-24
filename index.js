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

// name of the table in the postgreSQL database that stores all the countries & their respective codes
const countries = "countries";

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
    let queryResult = await db.query(`SELECT * FROM ${visitedCountriesTable}`);

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
  let countryToAdd = req.body.country;
  

  if (countryToAdd.trim().length === 0) {
    // user put space(s) as the country to be added
    console.error(
      `POST \'/add\' route: Please enter a country before clicking the \'add\' button.`
    );
  } else {
    // In the countries database, all of the countries start with a capital letter, 
    // all of the other letters are lowercase so we must clean up the user's input 
    // before we test it against the table in our database.
    countryToAdd = countryToAdd.toLowerCase();
    countryToAdd = countryToAdd.charAt(0).toUpperCase() + countryToAdd.slice(1);

    console.log('countryToAdd = ', countryToAdd);
    // Check countries table to see if the user's input is actually a valid country
    try {
      const result = await db.query(
        `SELECT * FROM ${countries} WHERE country_name = \'${countryToAdd}\'`
      );
      let validCountry = result.rows;
      console.log(
        "validCountry = ",
        validCountry,
        "\nvalidCountry.length = ",
        validCountry.length
      );

      if (validCountry.length !== 1) {
        // If a country is not returned, throw an error saying that the user's input is not a valid country
        console.error(
          `POST \'/add\' route: ${countryToAdd} is not a country. Please enter a country.`
        );
      } else {
        // Otherwise, get its country code 
        let code = validCountry[0].country_code;

        try {
          // and then add it to the visited_countries table.
          const insertCode = await db.query(`INSERT INTO ${visitedCountriesTable} (country_code) VALUES (\'${code}\')`);
          console.log('Inserted code result = ', insertCode);

          if(insertCode.rowCount === 1){
            console.log(`${countryToAdd} was added successfully!`);
            // return to the home page where the user will see the updated version of the map (the country the added will be colored in)
            res.redirect('/');
          } else {
            console.error(`Error inserting new code for ${countryToAdd}`);
          }

        } catch (err) {
          // an error occured
          console.error(`Error executing query on ${visitedCountriesTable} table: `, err.stack);
          res.status(500).send("Internal Server Error.");
        }
      }
      // If a country is returned, get its country code and then add it to the visited_countries
      // table. Otherwise, throw an error saying that the user's input is not a valid country
    } catch (err) {
      // an error occured
      console.error(`Error executing query on ${countries} table: `, err.stack);
      res.status(500).send("Internal Server Error.");
    }
  }
});

// close the connection to the database
// db.end();
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
