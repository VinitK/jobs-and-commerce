const deleteComment = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const commentId = btn.parentNode.querySelector('[name=commentId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const commentElement = btn.closest('.card');
    fetch(`/comment/${productId}/${commentId}`, { 
        method: 'DELETE', 
        headers: {
            'csrf-token': csrf
        }
    }).then(result=> {
        if (result){
            commentElement.parentNode.removeChild(commentElement);
        } else {
            throw new Error("Not authorized to delete!");
        }
    }).catch(err => {
        console.log(err);
    });
};