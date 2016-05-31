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
      def[queueType].__process(queueType, event, message)
    }
  });
  var mkQueue = function(queueType, publishFn, processMessageFn) {
    return {
      on: function(event, fn, bind) {
        if(!events[queueType]) events[queueType]={};
        if(!events[queueType][event]) {
          events[queueType][event]=[];
          sub.subscribe(event+':'+queueType);
        }
        events[queueType][event].push({bind: bind||this, fn: fn});
      },
      emit: function() {
        var args = Array.prototype.slice.call(arguments);
        var event = args.shift();
        if(!event) return;
        publishFn(queueType, event, args);
      },
      __process: processMessageFn
    }
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
        pub.rpop(prefix+event+':'+queueType, function(err, args) {
          if(!err && args) {
            events[queueType][event].forEach(function(listener) {
              process.nextTick(function() {
                if(args instanceof Array) {
                  listener.fn.apply(listener.bind, args);
                } else {
                  listener.fn.call(listener.bind, args);
                }
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
          process.nextTick(function() {
            if(message instanceof Array) {
              listener.fn.apply(listener.bind, message);
            } else {
              listener.fn.call(listener.bind, message);
            }
          });
        });
      })
  };
  return def;
}
