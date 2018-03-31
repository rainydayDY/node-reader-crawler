const request = require('./request.js');
const cheerio = require('cheerio');
const seekChapter = require('./seekChapter.js');

const connection = require('./connect.js');

let content = [];
let chapterList = [];


class Seek {
  constructor() {

  }

  createPromise(url) {
    let options = {
        url: url,
        type: 'get'
    }

    return new Promise((resolve, reject) => {
      options.callback = (data, _setCookie) => {
        resolve(data)
      }
      request(options, null);
    })
  }

  seek(callback) {
    let arr = chapterList.splice(0,5);
       let promise = Promise.all([
             this.createPromise(arr[0]['url']),
             this.createPromise(arr[1]['url']),
             this.createPromise(arr[2]['url']),
             this.createPromise(arr[3]['url']),
             this.createPromise(arr[4]['url'])
         ]);
       promise.then((result) => {
            for(let i = 0;i < 5; ++i){
              this.analyse(result[i],arr[i].chapterId,arr[i].listId, (data) => {
                content.push(data)
              })
            }
            // console.log(content)
             return chapterList.length === 0 ? callback(content) : this.seek(content)
         })
  }

  analyse(result,index,parIndex, callback) {
    const $ = cheerio.load(result);
    let itemObj = {
      id: index,
      novelId: parIndex,
      name: $('.bookname').children('h1').text(),
      content: $('#content').text()
    }
    connection.query('INSERT INTO chapter SET ?', itemObj, (error, data) => {
      if (error) {
        console.log('失败了')
      }else {
        console.log('成功下载小说啦')
      }
    })
    return callback(itemObj)
  }
}

module.exports = () => {
    let seek = new Seek();
    return new Promise((resolve,reject) => {
      seekChapter().then(data => {
         chapterList = data;
         seek.seek((page) => {
           connection.end();
           resolve(page);
         })
      })
    })
}
