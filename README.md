> node 爬虫基础

需求：使用node.js实现爬取“八一八中文网”的小说列表、章节、内容，并连接mysql，将爬取数据插入到数据库中。

技术储备：ES6 + node js + jquery + mysql (必须)
        nunjucks js + webpack + express (非必须)

&npsp;&npsp;总结我这一周都做了哪些事，乱七八糟的看了不少，代码也敲了不少，然而实际产出却觉得没有多少，可能是我学习方式有问题，导致的学习效率不高。这一周看node看了应该说是一天半，[express](http://www.expressjs.com.cn/4x/api.html#app.all)看了一天半（推荐阅读的[express讲解](https://bignerdcoding.com/archives/41.html)），[nunjucks](https://www.liaoxuefeng.com/wiki/001434446689867b27157e896e74d51a89c25cc8b43bdb3000/0014713964925087c29166d8c344a949364e40e2f28dc09000)看了小半天，[browser-sync](http://www.browsersync.cn/)也配置了小半天，弄热更新弄了小半天，捣鼓来捣鼓去的也没有产出，明明都能够检测到我更新了js，但是浏览器没有刷新。navicat连接本地mysql弄了大半天，对了，处理gbk网页中文乱码还花费了大半天的时间实际上我真正用来产出实际内容只有一天的时间，完成了爬取30本小说，不得不佩服这些写小说的，一本小说八百多章，以一次下载五章的并发速度，下载这30本书花了好几分钟，实际上爬取速度很快，插入到数据库中的速度比较慢。

点击查看[项目源码](https://github.com/rainydayDY/node-reader-crawler)，欢迎star
## 思路梳理
1. 首先找到目标网址，分析网页结构；
2. 发送请求到目标网址。
3. 解析返回的网页，提取数据，插入数据库。
## 知识梳理
### ES6 Promise 实现异步
&nbsp;&nbsp;考虑到需求，所以使用promise：
1. 请求和处理是要分开的；（请求网址，返回网页，解析网页）
2. 请求的不同部分也是作为模块进行分离；（爬取列表页、章节页、内容页）
3. 请求的url不止一个（一本小说包含若干个章节）
> Promise: 简单来说就是一个容器，里面保存着异步操作的结果，new Promise()创建实例，用then方法来接收异步操作的结果。Promise.all()将多个Promise实例包装成一个新的Promise实例。

```javascript
createPromise() {
    let options = {
        url: 'https://www.zwdu.com',
        type: 'GET'
    }        
    return new Promise((resolve, reject) => {
        options.callback = (data, _setCookie) => {
            resolve(data)
        }
        request(options, null);
    })
}
seek(callback) {
    let promise = Promise.all([
        this.createPromise(arr[0]['url']),
        this.createPromise(arr[1]['url']),
        this.createPromise(arr[2]['url']),
        this.createPromise(arr[3]['url']),
        this.createPromise(arr[4]['url'])
    ]);
    promise.then((result) => {})
  }
```

### node Request 爬取网页
&nbsp;&nbsp;node js http模块有get和request两个方法，用哪个都可以，我用的是request方法。
```javascript
const URL = url.parse(options.url);

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
    let html = [];
    res.on('data', result => {
        html.push(result);
    });

    res.on('end', () => {
        options.callback && options.callback(html, res.headers['set-cookie'])
    })
});

req.on('error', e => {
  options.callback && options.callback(e)
});

req.end();
```
### iconv-lite 解决中文乱码
&nbsp;&nbsp;因为爬取的网站的编码方式是gbk，所以request返回的结果就是‘****’，还伴随乱码，所以使用了iconv-lite，在解决乱码的时候花了很长时间，因为按照官方文档的例子，给结果设置了编码方式如下：
```javascript
 res.setEncoding('UTF-8');
```
导致直接输出结果的时候，返回的是html结构，只不过原来的网页内容变成了小星星，所以考虑到这是乱码了，用了官方提供的iconv-lite后，直接push(result)，结果报错，报的错是Buffer.concat的不是数组，可是事实就是数组啊，后来查阅Buffer，发现网页设置编码后返回的根本就不是buffer，所以你调用buffer的方法就会报错，除非你在push结果的时候采用如下方式：
```javascript
html.push(Buffer.alloc(result.length,result));
```
相当于把返回的结果又转换成Buffer了，所以报错结束，但是，乱码不是小星星，又变成难懂的文字了，总之还是乱码，到现在我也不清楚为什么，只是把setEncoding去掉就好了。
```javascript
const iconv = require('iconv-lite');
let htmlLength = 0;
res.on('data', result => {
    html.push(Buffer.alloc(result.length,result));
    htmlLength += result.length;
});

res.on('end', () => {
    options.callback && options.callback(iconv.decode(Buffer.concat(html,htmlLength), 'gbk'), res.headers['set-cookie'])
})
```
### cherrio 解析网页
语法同jquery
### node 连接 mysql
&nbsp;&nbsp;这里有一个问题，就是如果模块之间都有依赖，则在第一个模块连接数据库，最后一个模块断开连接，否则会报错。
```javascript
const mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'reader'
});

connection.connect();
let itemObj = {
    id: index,
    novelId: parIndex,
    name: $('.bookname').children('h1').text(),
    content: $('#content').text()
}
connection.query('INSERT INTO chapter SET ?', itemObj, (error, data) => {
  if (error) throw error
})
connection.end();

```
最后，整个项目用到的依赖包：
```javascript
{
  "cheerio": "^1.0.0-rc.2",
  "iconv-lite": "^0.4.19",
  "mysql": "^2.15.0"
}
```
