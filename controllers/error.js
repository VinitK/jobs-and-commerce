exports.get404 = (req, res, next) => {
    return res.status(404).render('404', { 
        docTitle: '404'
    });
};

exports.get500 = (req, res, next) => {
    return res.status(500).render('500', { 
        docTitle: '500',
        error: "Inform Support"
    });
};