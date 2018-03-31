const request = require('./request.js');
const cheerio = require('cheerio');
const baseUrl = 'https://www.zwdu.com';

class Seek {
    constructor(){

    }

    createPromise() {
        let options = {
            url: 'https://www.zwdu.com',
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
        this.createPromise().then((result) => {
          const $ = cheerio.load(result);
          let list= [];
          const newscontent = $('#newscontent').children('.l').children('ul');
          newscontent.children('li').each(function (index, item) {
            let url = $(this).children('.s2').children('a').attr('href')
            let itemObj = {
              id: url.split('/')[2],
              title: $(this).children('.s2').children('a').text(),
              url: baseUrl + url
            }
              list.push(itemObj)
              if(index === newscontent.children('li').length - 1) {
                callback(list)
              }
          })
        })

    }
}
module.exports = () => {
    let seek = new Seek();
    return new Promise((resolve,reject) => {
        seek.seek(pages => {
            resolve(pages);
        })
    })
}
