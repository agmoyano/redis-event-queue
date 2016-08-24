var redis = require('redis');

module.exports = function(ops) {
  var events = {
    workqueue: {},
    broadcast: {}
  };
  !ops && (ops = {});
  var prefix = (ops.prefix||'req')+':';
  delete ops.prefix;
  var sub = redis.createClient(ops);
  var pub = redis.createClient(ops);
  sub.on("message", function(event, message) {
    evtQueue = event.split(':');
    var queueType = evtQueue.pop();
    event = evtQueue.join(':');
    if(events[queueType] && events[queueType][event]) {
      try {
        message = JSON.parse(message);
      }catch(e) {}
      def[queueType].__process(queueType, event, message)
    }
  });
  var mkQueue = function(queueType, publishFn, processMessageFn) {
    var def = {
      on: function(event, fn) {
        if(!events[queueType]) events[queueType]={};
        if(!events[queueType][event]) {
          events[queueType][event]=[];
          sub.subscribe(event+':'+queueType);
        }
        events[queueType][event].push({bind: this, fn: fn});
      },
      emit: function() {
        var args = Array.prototype.slice.call(arguments);
        var event = args.shift();
        if(!event) return;
        if(args.length) {
          try {
            args = JSON.stringify(args);
          }catch(e) {}
        }
        publishFn(queueType, event, args);
      },
      eventNames: function() {
        return Object.keys(events[queueType]);
      },
      listenerCount: function(event) {
        return events[queueType][event]?events[queueType][event].length:0;
      },
      listeners: function(event) {
        return events[queueType][event];
      },
      once: function(event, fn) {
        if(!events[queueType]) events[queueType]={};
        if(!events[queueType][event]) {
          events[queueType][event]=[];
          sub.subscribe(event+':'+queueType);
        }
        events[queueType][event].push({bind: this, fn: fn, once: true});
      },
      prependListener: function(event, fn) {
        if(!events[queueType]) events[queueType]={};
        if(!events[queueType][event]) {
          events[queueType][event]=[];
          sub.subscribe(event+':'+queueType);
        }
        events[queueType][event].unshift({bind: this, fn: fn});
      },
      prependOnceListener: function(event, fn) {
        if(!events[queueType]) events[queueType]={};
        if(!events[queueType][event]) {
          events[queueType][event]=[];
          sub.subscribe(event+':'+queueType);
        }
        events[queueType][event].unshift({bind: this, fn: fn, once: true});
      },
      removeAllListeners: function(event) {
        delete events[queueType][event];
        sub.unsubscribe(event+':'+queueType);
      },
      removeListener: function(event, listener) {
        if(!events[queueType][event]) return;
        for(var i =0; i < events[queueType][event].length; i++) {
          if(events[queueType][event][i].fn == listener) {
            events[queueType][event].splice(i,1);
            break;
          }
        }
        if(!events[queueType][event].length) {
          delete events[queueType][event];
          sub.unsubscribe(event+':'+queueType);
        }
      },
      __process: processMessageFn
    };
    def.addListener = def.on;
    return def;
  }
  var def = {
    workqueue: mkQueue(
      'workqueue',
      function(queueType, event, args) {
        pub.multi()
          .lpush(prefix+event+':'+queueType, args)
          .expire(prefix+event+':'+queueType, 5)
          .publish(event+':'+queueType, 'new message')
          .exec(function(err, replies) {
            if(err) console.log(err);
          });
      },
      function(queueType, event, message) {
        pub.rpop(prefix+event+':'+queueType, function(err, message) {
          if(!err && message) {
            try {
              message = JSON.parse(message);
            }catch(e) {}
            var once = [];
            events[queueType][event].forEach(function(listener, i) {
              if(listener.once) once.unshift(i);
              process.nextTick(function() {
                if(message instanceof Array) {
                  listener.fn.apply(listener.bind, message);
                } else {
                  listener.fn.call(listener.bind, message);
                }
              });
              once.forEach(function(pos) {
                events[queueType][event].splice(i, 1);
              });
            });
          }
        });
      }),
    broadcast: mkQueue(
      'broadcast',
      function(queueType, event, args) {
        pub.publish(event+':'+queueType, args, function(err, replies) {
          if(err) console.log(err);
        });
      },
      function(queueType, event, message) {
        events[queueType][event].forEach(function(listener) {
          if(listener.once) once.unshift(i);
          process.nextTick(function() {
            if(message instanceof Array) {
              listener.fn.apply(listener.bind, message);
            } else {
              listener.fn.call(listener.bind, message);
            }
          });
          once.forEach(function(pos) {
            events[queueType][event].splice(i, 1);
          });
        });
      })
  };
  return def;
}
