const http = require('https');
const url = require('url');
const iconv = require('iconv-lite');

module.exports = (options,cookie) => {
    const URL = url.parse(options.url);
    cookie = cookie || '';

    let requestOptions = {
        host: URL.hostname,
        port: URL.port,
        path: URL.path,
        method: 'GET',
        headers: {
            Cookie: cookie
        }
    }

    const req = http.request(requestOptions, (res) => {
        // res.setEncoding('UTF-8');
        let html = [];
        let htmlLength = 0;
        res.on('data', result => {
            html.push(Buffer.alloc(result.length,result));
            htmlLength += result.length;
        });

        res.on('end', () => {
            options.callback && options.callback(iconv.decode(Buffer.concat(html,htmlLength), 'gbk'), res.headers['set-cookie'])
        })
    });

    req.on('error', e => {
      options.callback && options.callback(e)
    });

    req.end();
}
