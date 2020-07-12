const util = require('util'); // DEBUG

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
  const queryOrders = `SELECT order_id FROM orders`; // gets an array of orders
  pool.query(queryOrders, function(err, orders) {
    // console.log("orders:", err, orders.rows); // DEBUG
    res.locals.orders = orders.rows;

    let itemsNeeded = null;
    let itemsReturned = 0;
    
    //Iterate through active orders for later queries
    for (let iOrder = 0; iOrder < orders.rows.length; iOrder++) {
      // console.log('iOrder: ', iOrder, '\torders.rows[iOrder].order_id: ', orders.rows[iOrder]); // DEBUG
      const queryLineItemsInOrder =
          `SELECT * FROM itemsOrders io
          JOIN orders on orders.order_id = io.order_id
          WHERE orders.order_id=${orders.rows[iOrder].order_id}`;
          // AND io.plt_qty > 0

      pool.query(queryLineItemsInOrder, function(err, lineItems) {
        if (lineItems.rows.length !== 0) {
          //console.log("lineItems.rows: ", lineItems.rows,"\tline rows:", lineItems.rows.length); //DEBUG
          res.locals.orders[iOrder].lineItems = lineItems.rows;
          itemsNeeded += lineItems.rows.length;
          for (const lineItem of lineItems.rows) {
            //Get all information about item and bins for one row to be displayed in the order
            const queryInvItem =
                `SELECT i.case_qty, i.case_plt, i.name, inv.qty_avail, io.plt_qty, io.order_id, io.item_id,
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
                    JOIN itemBins ib 
                      ON ib.bin_id=b.bin_id
                      AND ib.warehouse_id=1
                    JOIN itemsOrders io 
                      ON io.item_id=ib.item_id
                    WHERE b.is_pick_bin=false
                    AND io.item_id=${lineItem.item_id}
                    ORDER BY ib.quantity ASC,
                    b.area DESC
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
                AND io.plt_qty > 0`;

            pool.query(queryInvItem, function(err, invItem) {
              // console.log("***********items:", err, invItem.rows[0]); // DEBUG
              if (invItem.rows[0]) {
                res.locals.orders[iOrder].hasPallet = true;
                lineItem.invItem = invItem.rows[0];
              }
              itemsReturned++;

              if (itemsReturned === itemsNeeded) {
                //Utils allows you to see what is in nested objects
                console.log("fully-compiled orders: ", util.inspect(res.locals.orders, false, null)); // DEBUG
                // console.log("fully-compiled orders: ", JSON.stringify(res.locals.orders)); // DEBUG
                res.render('pages/full-pallets-list.ejs');
              }
            }); // end of queryInvItem
          }
        }
      }); // end of queryLineItemsInOrder
    }
  }); // end of queryOrders
});

//Get the full case version of the same page
app.get('/full-cases-list/', function(req, res) {
  
  const queryOrders = `SELECT order_id FROM orders`; // gets an array of orders
  pool.query(queryOrders, function(err, orders) {
    //console.log("orders:", err, orders.rows); // DEBUG
    res.locals.orders = orders.rows;

    let itemsNeeded = null;
    let itemsReturned = 0;
    
    //Iterate through active orders for later queries
    for (let iOrder = 0; iOrder < orders.rows.length; iOrder++) {
      //console.log('iOrder: ', iOrder, '\torders.rows[iOrder].order_id: ', orders.rows[iOrder]); // DEBUG
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
              AND io.cs_qty > 0`;

          pool.query(queryInvItem, function(err, invItem) {
            console.log("invItem:", err, invItem.rows[0]); // DEBUG
            if (invItem.rows[0]) {
              res.locals.orders[iOrder].hasCase = true;
              lineItem.invItem = invItem.rows[0];
            }
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
  const queryOrders = `SELECT order_id FROM orders`; // gets an array of orders
  pool.query(queryOrders, function(err, orders) {
    console.log("orders:", err, orders.rows); // DEBUG
    res.locals.orders = orders.rows;

    let itemsNeeded = null;
    let itemsReturned = 0;
    
    //Iterate through active orders for later queries
    for (let iOrder = 0; iOrder < orders.rows.length; iOrder++) {
      // console.log('iOrder: ', iOrder, '\torders.rows[iOrder].order_id: ', orders.rows[iOrder]); // DEBUG
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
              `SELECT i.case_qty, i.name, inv.qty_avail, io.pc_qty, io.order_id, io.item_id,
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
              AND io.pc_qty > 0`;

          pool.query(queryInvItem, function(err, invItem) {
            // console.log("items:", err, invItem.rows[0]); // DEBUG
             if (invItem.rows[0]) {
              res.locals.orders[iOrder].hasPartial = true;
              lineItem.invItem = invItem.rows[0];
            }
            itemsReturned++;

            if (itemsReturned === itemsNeeded) {
              res.render('pages/partials-list.ejs');
            }
          }); // end of queryInvItem
        }
      }); // end of queryLineItemsInOrder
    }
  }); // end of queryOrders
});

app.get('/view-only/', function(req, res) {
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
              `SELECT i.case_qty, i.name, inv.qty_avail, io.cs_qty, io.pc_qty, io.plt_qty, io.order_id, io.item_id,
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
              AND io.order_id=${orders.rows[iOrder].order_id}`;

          pool.query(queryInvItem, function(err, invItem) {
            console.log("items:", err, invItem.rows[0]); // DEBUG
            lineItem.invItem = invItem.rows[0];
            itemsReturned++;

            if (itemsReturned === itemsNeeded) {
              res.render('pages/view-only.ejs');
            }
          }); // end of queryInvItem
        }
      }); // end of queryLineItemsInOrder
    }
  }); // end of queryOrders
});
//function for changing status in order
//sample function for deleting order
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

app.post("",function() {

});
app.patch("/updateOrder/:order_id",function(req, res){
  //If all items on order are indicated pulled update status to fullly pulled otherwise update to partly pulled
  const sql = "update orders SET status = 'partial pulled' WHERE order_id =$1::int";
  const params = [req.params.order_id];
  
  pool.query(sql, params, function(dbErr, dbRes) {
    if (dbRes.status = 'fully pulled') {
      res.status(200).send('success');
    } else {
      res.status(400).send(dbErr);
    }
  });

});