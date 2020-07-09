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
  // const queryItems = `SELECT i.case_qty,i.name,inv.qty_avail,io.cs_qty,io.order_id,io.item_id
  //     FROM itemsOrders io
  //     JOIN items i ON io.item_id=i.item_id 
  //     JOIN inventory inv ON inv.item_id=io.item_id
  //     AND inv.warehouse_id=1`;
  // const queryPickBin = `SELECT b.name
  //     FROM bins b
  //     JOIN itemBins ib ON ib.bin_id=b.bin_id
  //     AND ib.warehouse_id=1
  //     JOIN itemsOrders io ON io.item_id=ib.item_id
  //     WHERE b.is_pick_bin=true
  //     ORDER BY io.items_orders_id`;
  // const queryPrimaryBin = `SELECT b.name
  //     FROM bins b 
  //     JOIN itemBins ib ON ib.bin_id=b.bin_id
  //     AND ib.warehouse_id=1
  //     JOIN itemsOrders io ON io.item_id=ib.item_id
  //     WHERE b.is_pick_bin=false
  //     ORDER BY ib.quantity ASC`;


  const queryOrders = `SELECT order_id FROM orders`; // gets an array of orders
  pool.query(queryOrders, function(err, orders) {
    console.log("orders:", err, orders.rows); // DEBUG
    res.locals.orders = orders.rows;

    let itemsNeeded = null;
    let itemsReturned = 0;
    
    //Iterate through active orders for later queries
    for (let iOrder = 0; iOrder < orders.rows.length; iOrder++) {
      console.log('iOrder: ', iOrder, '\torders.rows[iOrder].order_id: ', orders.rows[iOrder]); // DEBUG
      const queryLineItemsInOrder =
          `SELECT * FROM itemsOrders io
          JOIN orders on orders.order_id = io.order_id
          WHERE orders.order_id=${orders.rows[iOrder].order_id}`;

      pool.query(queryLineItemsInOrder, function(err, lineItems) {
        res.locals.orders[iOrder].lineItems = lineItems.rows;
        itemsNeeded += lineItems.rows.length;

        for (const lineItem of lineItems.rows) {
          //Get all information about item and bins for one row to be displayed in the order
          const queryInvItem =
              `SELECT i.case_qty, i.name, inv.qty_avail, io.cs_qty, io.order_id, io.item_id,
                (
                  SELECT b.name
                    FROM bins b
                  JOIN itemBins ib ON ib.bin_id=b.bin_id
                    AND ib.warehouse_id=1
                  JOIN itemsOrders io ON io.item_id=ib.item_id
                    WHERE b.is_pick_bin=true
                    AND io.item_id=${lineItem.item_id}
                  ORDER BY io.items_orders_id
                  LIMIT 1
                ) AS pick_bin,
                (
                  SELECT b.name
                  FROM bins b 
                  JOIN itemBins ib ON ib.bin_id=b.bin_id
                  AND ib.warehouse_id=1
                  JOIN itemsOrders io ON io.item_id=ib.item_id
                  WHERE b.is_pick_bin=false
                  AND io.item_id=${lineItem.item_id}
                  ORDER BY ib.quantity ASC
                  LIMIT 1
                ) AS primary_bin
              FROM itemsOrders io
              JOIN items i
                ON i.item_id=io.item_id
              JOIN inventory inv
                ON inv.item_id=io.item_id
                AND inv.warehouse_id=1
              WHERE io.item_id=${lineItem.item_id}
              AND io.order_id=${orders.rows[iOrder].order_id}
              AND io.case_qty > 0`;

          pool.query(queryInvItem, function(err, invItem) {
            console.log("items:", err, invItem.rows[0]); // DEBUG
            lineItem.invItem = invItem.rows[0];
            itemsReturned++;

            if (itemsReturned === itemsNeeded) {
              res.render('pages/full-cases-list.ejs');
            }
          }); // end of queryInvItem
        }
      }); // end of queryLineItemsInOrder
    }
  }); // end of queryOrders
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
