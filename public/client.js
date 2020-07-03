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
    console.log(data);
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
      switch(title) {
        case "Partials":
            clearFilter();
            document.getElementById("partials").checked = true;
            document.getElementById("partials").disabled = true;
            break;
        case "Full Cases":
            clearFilter();
            document.getElementById("full cases").checked = true;
            document.getElementById("full cases").disabled = true;
            break;
        case "Full Pallets":
            clearFilter();
            document.getElementById("full pallets").checked = true;
            document.getElementById("full pallets").disabled = true;
            break;
        default:
            clearFilter();

      }
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
}

function deleteOrder(order_id) {
  requestResource('DELETE', 'deleteOrder/' + order_id, /* body= */ null, function(data) {
    // handle result
  })
}

function setRowData(item_id,order_id) {
    //Get primary bin by item_id
    requestResource('GET', 'primaryBinForItem/' + item_id,
       /* body= */ null, function(item_id){})
    //Get pick_bin by item_id
    requestResource('GET', 'pickBinForItem/' + item_id,
       /* body= */ null, getPickBin(item_id))
    
    //Get item/order information ie case pack and requested case amount
    requestResource('GET', 'rowInfoByOrder/' + order_id,
       /* body= */ null, getRowDetails(item_id,order_id))
    
}