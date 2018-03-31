const request = require('./request.js');
const cheerio = require('cheerio');
const baseUrl = 'https://www.zwdu.com';
const seekList = require('./seekList.js');

const connection = require('./connect.js');
connection.connect();


let chapter = [];
let bookList = [];


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
    let arr = bookList.splice(0,5);
       let promise = Promise.all([
             this.createPromise(arr[0]['url']),
             this.createPromise(arr[1]['url']),
             this.createPromise(arr[2]['url']),
             this.createPromise(arr[3]['url']),
             this.createPromise(arr[4]['url'])
         ]);
       promise.then((result) => {
            for(let i = 0;i < 5; ++i){
              this.analyse(result[i], (data) => {
                chapter = chapter.concat(data);
              })
            }
             return bookList.length === 0 ? callback(chapter) : this.seek(callback)
         })
  }

  analyse(result,callback) {
    const $ = cheerio.load(result);
    let list= [];
    let chapterArr = [];
    const boxChapter = $('#list').children('dl');
    let addSql={
      id: boxChapter.children('dd').children('a').eq(0).attr('href').split('/')[2],
      name: $('#info').children('h1').text(),
      category: $('.con_top').children('a').eq(1).text().trim(),
      author: $('#info').children('p').eq(0).text().split("：")[1],
      abstract: $('#intro').children('p').eq(0).text()
    }
    boxChapter.children('dd').each(function (index, item) {
      let url = $(this).children('a').attr('href')
      let itemObj = {
        chapterId: (url.split('/')[3]).split('.')[0],
        title: $(this).children('a').text().trim(),
        url: baseUrl + url,
        listId: url.split('/')[2]
      }
      chapterArr.push(itemObj.chapterId)
        list.push(itemObj)
        if(index === boxChapter.children('dd').length - 1) {
          // console.log(chapterArr)
          connection.query('INSERT INTO novel SET ?', addSql, (error, data) => {
            if (error) {
              console.log('失败了')
            }else {
              console.log('成功啦')
            }
          })
          return callback(list)
        }
    })
  }
}

module.exports = () => {
    let seek = new Seek();
    return new Promise((resolve,reject) => {
      seekList().then(data => {
         bookList = data;
         seek.seek((page) => {
           resolve(page);
         })
      })
    })
}
