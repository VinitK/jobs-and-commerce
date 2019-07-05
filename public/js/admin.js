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
        console.log(result,"deleted product | result");
        if (result.ok) {
            productElement.parentNode.removeChild(productElement);
        } else {
            const err = "Not authorized to delete!";
            form.querySelector('#alert').removeAttribute("hidden")
            form.querySelector('#alert').textContent = err;
        }
    }).catch(err => {
        form.querySelector('#alert').removeAttribute("hidden")
        form.querySelector('#alert').textContent = err;
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
            fetch(`/upload/prodimage/${files[0].type}`).then(response => { // get temporary URL
                if (response.ok){
                    return response.json();
                } else {
                    const err = "Make sure to upload image of type jpeg, jpg, or png.";
                    form.querySelector('#alert').removeAttribute("hidden")
                    form.querySelector('#alert').textContent = err;
                    throw new Error(err);
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
                    const err = "Something went wrong. Product could not be saved.";
                    form.querySelector('#alert').removeAttribute("hidden");
                    form.querySelector('#alert').textContent = err;
                    throw new Error(err);
                }
            }).then(result => {
                window.location.replace("/admin/products");
            }).catch(err => {
                form.querySelector('#alert').removeAttribute("hidden");
                form.querySelector('#alert').textContent = err;
            });
        } else { // else Update Product Without Image
            return fetch('/admin/edit-product', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'csrf-token': csrf
                }
            }).then(response => {
                console.log(response);
                if (response.ok === false) {
                    return response.json();
                }
            }).then(data => {
                if (data) {
                    form.querySelector('#alert').removeAttribute("hidden");
                    form.querySelector('#alert').textContent = data.errorMessage;
                } else {
                    window.location.replace("/admin/products");
                }
            }).catch(err => {
                form.querySelector('#alert').removeAttribute("hidden");
                form.querySelector('#alert').textContent = err;
            });
        }
    } else { // else create new product
        const files = form.querySelector('[name=image]').files;
        if (files.length > 0) { // get the file from frontend
            const url = `/upload/prodimage/${files[0].type}`;
            fetch(url)
            .then(result => { // get temporary URL
                console.log(result, "one");
                if (result.ok){
                    return result.json();
                } else {
                    const err = "Make sure to upload image of type jpeg, jpg, or png.";
                    form.querySelector('#alert').removeAttribute("hidden");
                    form.querySelector('#alert').textContent = err;
                }
            }).then(result => {
                console.log(result, "two");
                data.imageUrl = result.url.split("?", 1)[0];
                console.log(data, "two-one");
                return fetch(result.url, { // save at the URL
                    method: 'PUT', 
                    body: files[0],
                    headers: {
                        'Content-Type': files[0].type
                    }
                });
            }).then(result => {
                if(result.ok) {
                    return fetch('/admin/add-product', { // Save Product in Database
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: {
                            'Content-Type': 'application/json',
                            'csrf-token': csrf
                        }
                    });
                } else {
                    const err = "Something went wrong. Product could not be saved.";
                    form.querySelector('#alert').removeAttribute("hidden");
                    form.querySelector('#alert').textContent = err;
                }
            }).then(result => {
                window.location.replace("/admin/products");
            }).catch(err => {
                form.querySelector('#alert').removeAttribute("hidden");
                form.querySelector('#alert').textContent = err;
            });
        } else {
            const err = "Image is missing";
            form.querySelector('#alert').removeAttribute("hidden");
            form.querySelector('#alert').textContent = err;
        }
    }
}