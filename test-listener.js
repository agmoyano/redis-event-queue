var req = require('./index')();
var wqueue = req.workqueue;
var bqueue = req.broadcast;
wqueue.on('event', function(msg) {
  console.log('work: '+msg);
});
bqueue.on('event', function(msg) {
  console.log('broad: '+msg);
})
