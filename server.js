const express = require('express');
var http = require('http');
const path = require('path');
const PORT = process.env.PORT || 5000;

const { Pool } = require('pg'); // https://node-postgres.com
const pool = new Pool();

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
  console.log("here");
  //create a query that uses the .sql file for the item orders information
  res.render('pages/full-cases-list');
  //Try to execute that query
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    //pool.end()
  })
  
});

  app.get('/partials-list/', function(req, res) {
    res.render('pages/partials-list');
  });

  app.get('/view-only/', function(req, res) {
    res.render('pages/view-only');
  });