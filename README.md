# redis-event-queue

Interprocess queue based on _Redis_ that implements _EventEmitter_ interface

# Install

```bash
npm install --save redis-event-queue
```

# Usage

**Emmiter**

```javascript
var req = require('redis-event-queue')(options);

var wqueue = req.workqueue;
var bqueue = req.broadcast;

for(var i = 0; i < 10; i++) {
  wqueue.emit('event', 'work msg '+i);
  bqueue.emit('event', 'broad msg '+i);
}
```

**Listener**

```javascript
var req = require('redis-event-queue')(options);

var wqueue = req.workqueue;
var bqueue = req.broadcast;

wqueue.on('event', function(msg) {
  console.log('work: '+msg);
});

bqueue.on('event', function(msg) {
  console.log('broad: '+msg);
});
```

## workqueue

Delivers a message to the first process available


## broadcast

Delivers a message to all processes listening

#Next

Add optional pattern to listen to messages in *workqueue* an *broadcast*

#Suggestions

If you have any suggestions, comments or bug reports, please add an issue in github or PR directly!

Thanks.
