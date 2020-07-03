const express = require('express');
var http = require('http');
const path = require('path');
const PORT = process.env.PORT || 5000;

const { Pool } = require('pg'); // https://node-postgres.com
const { query } = require('express');
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
  res.render('pages/full-pallets-list');
});

//Get the full case version of the same page
app.get('/full-cases-list/', function(req, res) {
  
  //queries
  let queryOrders = "select * FROM orders";
  let queryForRowInfo = `SELECT i.case_qty,i.name,inv.qty_avail,io.cs_qty,io.order_id,io.item_id
      FROM itemsOrders io
      JOIN items i ON io.item_id=i.item_id 
      JOIN inventory inv ON inv.item_id=io.item_id AND inv.warehouse_id=1`;
  let queryPickBin = `SELECT b.name
      FROM bins b
      JOIN itemBins ib ON ib.bin_id=b.bin_id AND ib.warehouse_id=1
      JOIN itemsOrders io ON io.item_id=ib.item_id
      WHERE b.is_pick_bin=true ORDER BY io.items_orders_id`;
  let queryWBin = `SELECT b.name
      FROM bins b 
      JOIN itemBins ib ON ib.bin_id=b.bin_id AND ib.warehouse_id=1
      JOIN itemsOrders io ON io.item_id=ib.item_id
      WHERE b.is_pick_bin=false ORDER BY ib.quantity DESC`;
  
  pool.query(queryForRowInfo, function(err, dbRes) {
    //console.log("query result:", err, dbRes.rows);
    pool.query(queryPickBin, function(err, dbRes2) {
      pool.query(queryWBin, function(err, dbRes3) {
        // res.locals.myData = dbRes.rows;
        // res.locals.myPickBin = dbRes2.rows;
        // res.locals.myWBin = dbRes3.rows;
        res.render('pages/full-cases-list.ejs', {myData: dbRes.rows, myPickBin: dbRes2.rows, myWBin: dbRes3.rows });    
      })
    })
    // res.json(query.rows);
  })
});

app.get('/partials-list/', function(req, res) {
  res.render('pages/partials-list');
});

app.get('/view-only/', function(req, res) {
  res.render('pages/view-only');
});

app.delete('/deleteOrder/:order_id', function(req, res) {
  const sql = 'DELETE FROM orders WHERE order_id=$1::int';
  console.log('req.params.order_id: ', req.params.order_id);
  const params = [req.params.order_id];
  
  pool.query(sql, params, function(dbErr, dbRes) {
    console.error('dbErr: ', dbErr);
    console.log('DELETE dbRes: ', dbRes);
    // if (dbRes.someProperty = 'success') {
    //   res.status(200).send('success');
    // } else {
    //   res.status(400).send(dbErr);
    // }
  });
});
