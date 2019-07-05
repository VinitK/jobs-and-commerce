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
            form.querySelector('#alert').removeAttribute("hidden");
            form.querySelector('#alert').textContent = err;
        }
    }).catch(err => {
        form.querySelector('#alert').removeAttribute("hidden");
        form.querySelector('#alert').textContent = err;
    });
};

const submitCV = (btn) => {
    // if file and valid file then update all
    // else return error that no valid file
    const form = btn.parentNode;
    const csrf = form.querySelector('[name=_csrf]').value;
    const files = form.querySelector('[name=resume]').files;
    const data = {};
    if (files.length > 0) { // get the file from frontend
        fetch(`/upload/resume/${files[0].type}`) // get temporary URL
        .then(result => {
            console.log(result, "one");
            if (result.ok){
                return result.json();
            } else {
                const err = "Invalid file. Make sure you upload a file of type pdf, doc, or docx";
                form.querySelector('#alert').removeAttribute("hidden");
                form.querySelector('#alert').textContent = err;
                throw new Error(err);
            }
        }).then(data => {
            if (data) {
                data.resumeUrl = data.url.split("?", 1)[0];
                console.log(data, "two");
                return fetch(data.url, { // save at the URL
                    method: 'PUT', 
                    body: files[0],
                    headers: {
                        'Content-Type': files[0].type
                    }
                });
            } else {
                const err = "Not authorized to upload file!";
                form.querySelector('#alert').removeAttribute("hidden");
                form.querySelector('#alert').textContent = err;
                throw new Error(err);
            }
        }).then(result => {
            console.log(result, "three");
            console.log(data, "four");
            if(result.ok) {
                return fetch('/cvfy/resume', { // Save Resume in Database
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json',
                        'csrf-token': csrf
                    }
                });
            } else {
                const err = `${response.status}: ${response.statusText}`;
                form.querySelector('#alert').removeAttribute("hidden");
                form.querySelector('#alert').textContent = err;
                throw new Error(err);
            }
        }).then(result => {
            window.location.replace("/cvfy");
        }).catch(err => {
            form.querySelector('#alert').removeAttribute("hidden");
            form.querySelector('#alert').textContent = err;
        });
    } else {
        const err = "File is missing"
        form.querySelector('#alert').removeAttribute("hidden");
        form.querySelector('#alert').textContent = err;
    }
}