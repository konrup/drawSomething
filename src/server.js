// Setup
const DEBUG = true;
const PORT = 8090;
const WebSocket = require('ws');
var ws = new WebSocket.Server({ port: PORT }, () => { if(DEBUG) console.log(`listening on ${PORT}...`); });

// State
var clients = [];
var counter = 1;

ws.on('connection', function (c) {
    var clientID = counter++;

    // Events
    c.on('message', function (msg) {
        if (DEBUG) console.log("<-- " + msg);
        try {
            var json = JSON.parse(msg);
            if (!json) throw "can't handle this";
            if (json.id == undefined) json.id = null;

            if (json.method) {
                var response = "{}";
                switch (json.method) {

                    case "setup":
                        clients[clientID] = c;
                        response = `{"id":${json.id},"result":${clientID},"error":null}`;
                        if (DEBUG) console.log("--> " + response);
                        c.send(response);
                        broadcast([`client (${clientID}) connected`]);
                        break;

                    case "broadcast":
                        if (!json.params) {
                            response = `{"id":${json.id},"error":"params not set"}`;
                            if (DEBUG) console.log("--> " + response);
                            c.send(response);
                        }
                        else broadcast(json.params);
                        break;

                    default:
                        reponse = `{"id":${json.id},"error":"method not found"}`;
                        if (DEBUG) console.log("--> " + response);
                        c.send(response);
                }
            } else { throw "can't handle this"; }
        } catch (e) {
            c.send(JSON.stringify({ "id": json ? json.id ? json.id : null : null, "error": e }));
            c.close(1007);
            removeClient(clientID);
        }
    });

    c.on("close", (code, msg) => {
        removeClient(clientID);
        broadcast(`client (${clientID}) disconnected`);
    });

    c.on("error", (err) => {
        removeClient(clientID);
        errorHandler(err, clientID);
        broadcast(`client [${clientID}] crashed`);
    });
});

ws.on("error", errorHandler);


// Helper
function errorHandler(err, clientID) {
    if(!DEBUG) return;
    console.log("ERROR" + clientID ? "[" + clientID + "]: " : ":");
    console.log(err);
}

/**
 * Sets the connection for the given client id to null
 * @param {number} id 
 */
function removeClient(id) {
    clients[id] = null;
}

/**
 * Broadcasts the given array to all active clients.
 * @param {any[]} msgArray 
 */
function broadcast(msgArray) {
    var str = JSON.stringify({ "method": "broadcast", "params": msgArray });
    if (DEBUG) console.log("->) " + str);
    for (var i = 1; i < clients.length; i++) {
        if (clients[i])
            clients[i].send(str);
    }
}