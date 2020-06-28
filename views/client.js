function toggleOrderView() {
    console.log("ran");
    if(document.getElementById('itemsTable').hidden == true)
        document.getElementById('itemsTable').hidden = false;
    else
    document.getElementById('itemsTable').hidden = true;
}