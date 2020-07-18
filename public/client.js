/**
 * REQUEST RESOURCE
 * Make an HTTP Request.
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {JSON} [body=null] 
 * @param {Function} callback 
 */
function requestResource(method, url, body = null, callback) {
  // HTTP method (POST/create, GET/read, PUT/update whole, PATCH/part, DELETE/delete)
  const options = {method: method};

  if (method !== "GET") {
    options["headers"] = {'Content-Type': 'application/json'};
    options["body"] = JSON.stringify(body);
  }

  fetch(url, options)
  .then(function (response) {
    if (response.ok) {
      // if (typeof response === "object") {
      //   return response.json();        
      // } else {
        return response.text();
      // }
    }
    throw Error("Network response was not OK");
  })
  .then(function (data) {
    //console.log(data);
    callback(data);
  })
  .catch(function (error) {
    console.log('There was a problem: ', error.message)
  });
}


function populateMain(tableName, title) {
  let filter = setFilter(title);
  requestResource('GET', tableName + '/'+filter, /* body= */ null, function(tableData) {
      document.getElementById('main').innerHTML = tableData;
      document.getElementById('title').innerHTML = title;
      //Set filter based on list title
      
  })

  function clearFilter(){
    document.getElementById("partials").checked = false;
    document.getElementById("full cases").checked = false;
    document.getElementById("full pallets").checked = false;
    document.getElementById("transfers").checked = false;

    document.getElementById("partials").disabled = false;
    document.getElementById("full cases").disabled = false;
    document.getElementById("full pallets").disabled = false;
  }
  function setFilter(title) {
    let filter = "";
    switch(title) {
      case "Partials":
          clearFilter();
          document.getElementById("partials").checked = true;
          document.getElementById("partials").disabled = true;
          filter += 'AND io.pc_qty > 0';
          break;
      case "Full Cases":
          clearFilter();
          document.getElementById("full cases").checked = true;
          document.getElementById("full cases").disabled = true;
          filter += 'AND io.cs_qty > 0';
          break;
      case "Full Pallets":
          clearFilter();
          document.getElementById("full pallets").checked = true;
          document.getElementById("full pallets").disabled = true;
          filter += 'AND io.plt_qty > 0';
          break;
      default:
          clearFilter();

    }
    return filter;
  }
}

function deleteOrder(order_id) {
  requestResource('DELETE', 'deleteOrder/' + order_id, /* body= */ null, function(data) {
    // handle result
  })
}

function updateOrder(order_id,itemName,item_id,casePack) {
    let amount = parseInt(document.getElementById(itemName+'_cs_pack').value) * parseInt(document.getElementById(order_id+'-'+itemName+'_cases').value);
    let expectedAmount = parseInt(document.getElementById(order_id+'-'+itemName+'_casesExpected').innerText)*casePack;
    if(amount == expectedAmount) {
      
      requestResource('PUT', 'updateOrder/' + order_id+'/'+item_id, /* body= */ null, function(data) {
        // handle result
        document.getElementById(order_id+'-'+itemName+'_row').remove();
        document.getElementById('ready').innerText = Number(document.getElementById('ready').innerText)+1; 
        if(document.getElementById(order_id+'_orderTable').rows.length === 1) {
          //remove table
          document.getElementById(order_id+"_card").remove();
          requestResource('PUT', 'updateOrder/' + order_id, null, function(data){
    //update orders to be combined
          })
        }
      });
    }
    else {
        if(confirm(`Warning! Your Amount: ${amount} Expected quantity: ${expectedAmount}. Are you sure you want to place this order on hold?`)) {
          //email notification
        }
    }

  }
