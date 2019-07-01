const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const productElement = btn.closest('.col-sm-4');
    fetch(`/admin/product/${productId}`, { 
        method: 'DELETE', 
        headers: {
            'csrf-token': csrf
        }
    }).then(result=> {
        if (result){
            productElement.parentNode.removeChild(productElement);
        } else {
            throw new Error("Not authorized to delete!");
        }
    }).catch(err => {
    });
};

const submitProduct = (btn) => {
    // check productId
    // if productId then update
        // if image then update all
        // else update everything except image
    // else new - update everything
    const form = btn.parentNode.parentNode;
    const title = form.querySelector('[name=title]').value;
    const description = form.querySelector('[name=description]').value;
    const price = +form.querySelector('[name=price]').value;
    const csrf = form.querySelector('[name=_csrf]').value;
    const data = {
        title: title,
        description: description,
        price: price
    };

    if (form.querySelector('[name=productId')) { // if updating existing product
        data.productId = form.querySelector('[name=productId').value;
        const files = form.querySelector('[name=image]').files;
        if (files.length > 0) { // if new file to update
            fetch('/upload/image').then(response => { // get temporary URL
                if (response.ok){
                    return response.json();
                } else {
                    throw new Error("Not authorized to upload image!");
                }
            }).then(response => {
                data.imageUrl = response.url.split("?", 1)[0];
                return fetch(response.url, { // save at the URL
                    method: 'PUT', 
                    body: files[0],
                    headers: {
                        'Content-Type': files[0].type
                    }
                });
            }).then(response => {
                if(response.ok) {
                    return fetch('/admin/edit-product', { // Save Product in Database
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: {
                            'Content-Type': 'application/json',
                            'csrf-token': csrf
                        }
                    });
                } else {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }
            }).then(result => {
                window.location.replace("/admin/products");
                console.log(result);
            }).catch(err => {
                console.error(err);
            });
        } else { // else add neww Product to Database
            return fetch('/admin/edit-product', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'csrf-token': csrf
                }
            }).then(result => {
                console.log(result);
                window.location.replace("/admin/products");
            }).catch(err => {
                console.error(err);
            });
        }
    } else { // else create new product
        const files = form.querySelector('[name=image]').files;
        if (files.length > 0) { // get the file from frontend
            fetch('/upload/image').then(response => { // get temporary URL
                console.log(response, "one");
                if (response.ok){
                    return response.json();
                } else {
                    throw new Error("Not authorized to upload image!");
                }
            }).then(response => {
                console.log(response, "two");
                data.imageUrl = response.url.split("?", 1)[0];
                console.log(data, "two-one");
                return fetch(response.url, { // save at the URL
                    method: 'PUT', 
                    body: files[0],
                    headers: {
                        'Content-Type': files[0].type
                    }
                });
            }).then(response => {
                console.log(response, "three");
                console.log(data, "four");
                if(response.ok) {
                    return fetch('/admin/add-product', { // Save Product in Database
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: {
                            'Content-Type': 'application/json',
                            'csrf-token': csrf
                        }
                    });
                } else {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }
            }).then(result => {
                console.log(result);
                window.location.replace("/admin/products");
            }).catch(err => {
                console.error(err);
            });
        } else {
            console.log("Image Missing");
        }
    }
}