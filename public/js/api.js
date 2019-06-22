const getProductsButton = document.getElementById('getProductsId');

getProductsButton.addEventListener('click', () => {
    fetch('http://localhost:5000/api/products')
    .then(res => res.json())
    .then(resData => document.getElementById('resultProductsId').innerText = JSON.stringify(resData, null, 2))
    .catch(err => console.log(err));
});

const postProductButton = document.getElementById('postProductId');

postProductButton.addEventListener('click', () => {

    title = document.getElementById('productTitleId').value;
    description = document.getElementById('productDescriptionId').value;
    price = document.getElementById('productPriceId').value;
    if (title==="" || description==="" || price===""){
        document.getElementById('resultProductId').innerText = "Invalid Input!";
    } else {
        fetch('http://localhost:5000/api/product', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                description: description,
                price: price,
            })
        }).then(res => res.json())
        .then(resData => document.getElementById('resultProductId').innerText = JSON.stringify(resData, null, 2))
        .catch(err => console.log(err));
    }
});