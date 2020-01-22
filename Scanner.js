/* * * * * * * * * * * * *
 * Author: Andrew B.     *
 *                       *
 * Title: Host Scanner   *
 *                       *
 * Desc: Scan external   *
 * or lan IP(s).         *
 *                       *
 * NOTE: TCP scan is     *
 * Quite buggy. Success  *
 * highly depends on     *
 * CHORS and your        *
 * browser version.      *
 *                       *
 * * * * * * * * * * * * *
 * See bottom of script  *
 * for usage.            *
 * * * * * * * * * * * * */

window.ko || jsr.callScript("https://cdnjs.cloudflare.com/ajax/libs/knockout/3.5.0/knockout-min.js")

let net = {
  ipRange: (function(CIDR, start = 0, finish = 254) {
    var range = [];
    for (i = (start - 1); i < finish; i++) {
      range[i] = (((CIDR.split('/'))[0].split('.')).slice(0, -1)).join('.') + '.' + (i + 1);
    }
    return range;
  }),
  tcp_ping: (function(ip, port, protocol, callback) {
    try {
      var milliseconds;
      var started = new Date().getTime();
      var http = new XMLHttpRequest();
      if (protocol !== "//") {
        protocol += "://";
      }
      try {
        http.open("GET", protocol + ip + ":" + port, /*async*/ true);
      } catch (e) {
        this.callback('Timeout', e);
      }
      http.onreadystatechange = function() { //lol
        if (http.readyState == 4) {
          var ended = new Date().getTime();
          this.milliseconds = ended - started;
        }
      }
      try {
        let data = {
          headers: {
            Accept: "application/json",
            Origin: "http://127.0.0.1/"
          },
          method: 'GET'
        };
        http.send(JSON.stringify(data));
      } catch (e) {
        if (milliseconds <= 0200) {
          this.callback('Responded', e);
        } else {
          this.callback('Timeout', e);
        }
      }
    } catch (e) {
      callback("Blocked by CORS", e);
    }
  }),
  web_ping: (function(ip, port, protocol, callback) { //lol
    if (protocol != '//') {
      protocol += '://'
    }
    if (port != 80 && port != "") {
      port = ':' + port;
    } else if (port == 80) {
      port = ":80";
      protocol = 'http://';
    } else {
      port = "";
    }
    if (!this.inUse) {
      this.status = 'unchecked';
      this.inUse = true;
      this.callback = callback;
      this.ip = ip;
      var _that = this;
      this.img = new Image();
      this.img.onload = function() {
        _that.inUse = false;
        _that.callback('responded');

      };
      this.img.onerror = function(e) {
        if (_that.inUse) {
          _that.inUse = false;
          _that.callback('responded', e);
        }

      };
      this.start = new Date().getTime();
      this.img.src = protocol + ip + port;
      this.timer = setTimeout(function() {
        if (_that.inUse) {
          _that.inUse = false;
          _that.callback('timeout');
        }
      }, 1500);
    }
  }),
  PingModel: (function(servers, callback = undefined, method = "web", port = '', protocol = "//") {
    if (!Array.isArray(servers)) {
      servers = servers.split('/')
    }
    var self = this;
    var myServers = [];
    ko.utils.arrayForEach(servers, function(location) {
      myServers.push({
        name: location,
        status: ko.observable('unchecked')
      });
    });
    self.servers = ko.observableArray(myServers);
    var out = {};
    ko.utils.arrayForEach(self.servers(), function(s) {
      s.status('checking');
      if (method === 'web' && s.name != undefined) {
        new net.web_ping(s.name, port, protocol, function(status, e) {
          s.status(status);
          out[s.name] = status;
        });
      } else if (s.name != undefined) { //tcp
        new net.tcp_ping(s.name, port, protocol, function(status, e) {
          s.status(status);
          out[s.name] = status;
        });
      }

    });
    callback(out);
    return out;
  })
}

//Methods supported are img, and tcp (TCP can be buggy depending on CORS)

// USAGE: function(servers, method = "web", port = '', protocol = "[automatic]")
//

//Example with ip range
var results = new net.PingModel(net.ipRange('10.0.0.0', 0, 50), function(e){
  console.log(e)
}, "web");
//var jsonPretty = JSON.stringify(results,null,4); 
//document.write(jsonPretty);
//console.log(jsonPretty);

//Example with single ip
//var results2 = net.PingModel("j-bot.tk/", "web", '443', 'https');
//console.log(results2);
// NOTE: keep ranges small, gets weird with lager ranges.
