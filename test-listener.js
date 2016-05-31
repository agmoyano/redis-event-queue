var req = new require('./index')();
var wqueue = req.workqueue;
var bqueue = req.broadcast;
wqueue.on('event', function(msg, other) {
  console.log('work: '+msg+' '+other);
});
bqueue.on('event', function(msg, other) {
  console.log('broad: '+msg+' '+other);
})
