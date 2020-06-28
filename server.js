const express = require('express');
var http = require('http');
const path = require('path');
const PORT = process.env.PORT || 5000;

const { Pool, Client } = require('pg'); // https://node-postgres.com
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false},
});
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

app.get('/full-pallets-list/', function(req, res) {
  res.render('pages/full-pallets-list')
  });
  //Get the full case version of the same page
  app.get('/full-cases-list/', function(req, res) {
    //create a query that uses the .sql file for the item orders information
  //   const q = {
  //     text: "SELECT * FROM itemsOrders",
      
  //   }
  //   //Try to execute that query
  //   pool
  //   .query(q)
  //   .then(function(dbRes) {
  //     console.log(dbRes.rows[0]+'test');
  //     res.status(200).json(dbRes.rows[0]);
  //   })
  //   .catch(function(err) {
  //     console.error("Error in query: ", err);
  //     res.status(500).json({success: false, data: err});
  //   });
  //   res.render('pages/full-cases-list')
  // });
  // app.get('/partials-list/', function(req, res) {
  //   res.render('pages/partials-list')
  // });
  // app.get('/view-only/', function(req, res) {

  res.render('pages/view-only');
  });