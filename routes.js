const fs = require('fs');

const reqHandler = (req, res) => {

    // Request Handling funtion that takes in request and response

    const url = req.url;
    const method = req.method;
    
    if (url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.write('<html><body><form action="/message" method="POST"><input type="text" name="message" placeholder="First Name"></input><button type="submit">Save</button></form></body></html>');
        return res.end();
    } 
    
    if (url === '/message' && method === "POST") {
        const body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        });
        return req.on('end', () => {
            const parsedBody = Buffer.concat(body).toString();
            const message = parsedBody.split("=")[1];

            // Writing to a json file the data received from parsing data received from request and the returning a response
            fs.writeFile(
                'message.json',
                '{ "firstname" : "'+message+'" }',
                () => {
                    res.statusCode = 302;
                    res.write('<html><body><h1>Hello '+message+'</h1></body></html>');
                    //res.setHeader('Location', '/'); // REDIRECTION
                    return res.end();
            });
        });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.write('<html><body><h1>404</h1><p>Page does not exist!</p></body></html>');
    res.end();
};

// Exporting function reqHandler
exports.handler = reqHandler;