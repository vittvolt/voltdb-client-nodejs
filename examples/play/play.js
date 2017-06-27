// Load the http module to create an http server.
var http = require('http');
var VoltClient = require('../../lib/client');
var VoltConfiguration = require('../../lib/configuration');
var VoltConstants = require('../../lib/voltconstants');
var util = require('util');
var VoltProcedure = require('../../lib/query');
var AsyncPolling = require('../../node_modules/async-polling')

var configs = [];
var client = new VoltClient(configs);

function voltinit() {
    // VoltDB js test
    // volt = require('../voter/voter/models/volt');
    // volt.initClient(false);

    // var configs = [];

    configs.push(getConfiguration('localhost'));
    // The client is only configured at this point. The connection
    // is not made until the call to client.connect().
    // client = new VoltClient(configs);
    
    // You can register for a long list of event types, including the results
    // of queries. Some developers will prefer a common message loop
    // while others will prefer to consume each event in a separate handler.
    // Queries can also be processed in a common handler at the client level,
    // but would be better handled by using a query callback instead.
    client.on(VoltConstants.SESSION_EVENT.CONNECTION,eventListener);
    client.on(VoltConstants.SESSION_EVENT.CONNECTION_ERROR,eventListener);
    client.on(VoltConstants.SESSION_EVENT.QUERY_RESPONSE_ERROR,eventListener);
    client.on(VoltConstants.SESSION_EVENT.QUERY_DISPATCH_ERROR,eventListener);
    client.on(VoltConstants.SESSION_EVENT.FATAL_ERROR,eventListener);
   
    // The actual connection. 
    // Note, there are two handlers. The first handler will generally indicate
    // a success, though it is possible for one of the connections to the 
    // volt cluster to fail.
    // The second handler is more for catastrophic failures.
    client.connect(function startup(code, event,results) {
      util.log('Node connected to VoltDB');
      callProc(2);
    }, function loginError(code, event, results) {
      util.log('Node did not connect to VoltDB');
    });

}

function getConfiguration(host) {
  var cfg = new VoltConfiguration();
  cfg.host = host;
  cfg.messageQueueSize = 20;
  return cfg;
}

function eventListener(code, event, message) {
  util.log(util.format( 'Event %s\tcode: %d\tMessage: %s', event, code, 
    message));
}

function callProc(num) {
    var selectProc = new VoltProcedure('tp', ['int']);
    var query = selectProc.getQuery();
    query.setParameters([num]);
    util.log('checkpoint...')

    client.callProcedure(query, function initVoter(code, event, results) {
        var val = results.table[0];
        util.log('Initialized app for ' + JSON.stringify(val).toString() + ' candidates.');
    });
}

AsyncPolling(function (end) {
    // Do whatever you want.
    callProc(1);    
    // Then notify the polling when your job is done:
    end();
    // This will schedule the next call.
}, 3000).run();

voltinit();

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello World\n");
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(3000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:3000/");