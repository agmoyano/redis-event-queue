var req = require('./index')();
var wqueue = req.workqueue;
var bqueue = req.broadcast;

for(var i = 0; i < 10; i++) {
  wqueue.emit('event', 'work msg '+i, 'other param');
  bqueue.emit('event', 'broad msg '+i, 'other param');
}
