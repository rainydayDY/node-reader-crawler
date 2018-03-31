var seekContent = require('./app/seekContent.js');

seekContent().then((data) => {
  var end = new Date();
  var time = (end.getTime() - before.getTime())/1000;
  console.log('总耗时:' + time + 's');
})
