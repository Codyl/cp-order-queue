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
  requestResource('GET', tableName, /* body= */ null, function(tableData) {
      document.getElementById('main').innerHTML = tableData;
      document.getElementById('title').innerHTML = title;
      //Set filter based on list title
      setFilter(title);
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
    var filter = "";
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
function updateOrder(order_id,expectedQty) {
    let amount = parseInt(document.getElementById(itemName+'_cs_pack').innerText) * parseInt(document.getElementById(itemName+'_cases').innerText);
    if(amount == expectedQty) {
        requestResource('PATCH', 'updateOrder/' + order_id, /* body= */ null, function(data) {
          // handle result
        });
    }
    else {
        alert(`Warning! Your Amount: ${amount} Expected quantity: ${expectedQty}. Are you sure you want to place this order on hold?`);
    }
  }
