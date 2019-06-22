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
        console.log(err);
    });
};