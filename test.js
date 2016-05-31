var req = require('./index')();
var wqueue = req.workqueue;
var bqueue = req.broadcast;

for(var i = 0; i < 10; i++) {
  wqueue.emit('event', 'work msg '+i);
  bqueue.emit('event', 'broad msg '+i);
}
