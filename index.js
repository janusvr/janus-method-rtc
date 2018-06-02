var wrtc = require('wrtc');

var RTCPeerConnection = wrtc.RTCPeerConnection,
	RTCSessionDescription = wrtc.RTCSessionDescription,
	RTCIceCandidate = wrtc.RTCIceCandidate;


function Plugin() {
    console.log("Loading janus-method-rtc");
    log.info("Loading janus-method-rtc");
}

var peers = {};

Plugin.prototype.call = function(data) {
    var from = data._userList[data._userId];
//console.log('rtc message', data);
    //from.send("blurp", {message: data.message});
    //
	var userid = data._userId;
	var peer = peers[userid];
    if (!peer) {
		peer = peers[userid] = new JanusClientRTC();
		peer.setServer(from);
	}
	peer.handleSignal(data);
}

module.exports = new Plugin();


class JanusClientRTC {
  init() {
    super.init();
/*
    this.defineAttributes({
      'username': { type: 'string' },
      'peername': { type: 'string' },
      'connecting': { type: 'boolean', default: false },
      'connected': { type: 'boolean', default: false },
      'state': { type: 'string', default: 'uninitialized' },
      'signalstate': { type: 'string', default: 'closed' }
    });
*/

    // states:
    // - uninitialized
    // - offer-made
    // - negotiating
    // - connected
    // - disconnected
  }
  create() {
  }
  setDebug(debug) {
    this.debug = debug;
  }
  getRTCConfiguration() {
    return {
      //'iceTransportPolicy': 'relay',
      'iceServers': [
        {
          'urls': [
            'stun:baicoianu.com:3478',
          ]
        },
        {
          'url': 'turn:testuser@baicoianu.com:3478?transport=udp',
          'username': 'testuser',
          'credential': '0xc80a61ec8d2023ac2bafc58f82cbefbb'
          //'credential': 'north'
        },
        {
          'url': 'turn:testuser@baicoianu.com:3478?transport=tcp',
          'username': 'testuser',
          'credential': '0xc80a61ec8d2023ac2bafc58f82cbefbb'
          //'credential': 'north'
        }
      ]
    };
  }
  getPeerConnection() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection(this.getRTCConfiguration());
      this.peer.onicecandidate = (ev) => this.handleIceCandidate(ev);
      this.peer.onaddstream = (ev) => this.handleAddStream(ev);
      this.peer.onremovestream = (ev) => this.handleRemoveStream(ev);
      this.peer.ontrack = (ev) => this.handleTrack(ev);
      this.peer.onnegotiationneeded = (ev) => this.handleNegotiationNeeded(ev);
      this.peer.onsignalingstatechange = (ev) => this.handleSignalingStateChange(ev);
      this.peer.oniceconnectionstatechange = (ev) => this.handleICEConnectionStateChange(ev);
    }
    return this.peer;
  }
  connect(stream) {
    this.connecting = true;
    var peer = this.getPeerConnection();
    this.setLocalStream(stream);
    console.log('Initiate connection', peer, stream, this);
    peer.createOffer().then((desc) => this.updateDescription(desc));
    this.state = 'offer-made';
  }
  receive(stream) {
    this.connecting = true;
    var peer = this.getPeerConnection();
    //if (stream !== this.localstream) {
console.log('burbhlh');
setTimeout(() => {
      this.setLocalStream(stream);
}, 100);
    //}
    console.log('Acknowledge connection', this, peer, peer.state);
    peer.createAnswer(peer.remoteDescription).then((desc) => this.updateDescription(desc));
  }
  setLocalStream(stream) {
    var peer = this.getPeerConnection();
    if (this.localstream) {
      console.log('remove existing stream', this.localstream);
      peer.removeStream(this.localstream);
    }
    if (stream) {
      this.localstream = stream;
      stream.getTracks().forEach((track) => {
        console.log('add local track', track, stream);
        peer.addTrack(track, stream);
      });
    }
    console.log('updated local stream');
  }
  shutdown() {
    var peer = this.getPeerConnection();
    peer.close();
    console.log('shutdown');
  }
  setServer(server) {
    this.server = server;
  }
  updateDescription(desc) {
    var peer = this.getPeerConnection();
    console.log('Sending SDP description', desc, peer);
    peer.setLocalDescription(desc);
    this.signal(desc);
  }
  signal(msg) {
    // TODO - we should send VOIP handshake data as a separate packet type, the server will need to be modded to forward them
    var realmsg = {};
    for (var k in msg) {
      if (typeof msg[k] != 'function') {
        realmsg[k] = msg[k];
      }
    }
    realmsg.peername = this.peername;
    this.server.send('rtc', realmsg);
    //console.log('SIGNAL', this.username, this.peername, realmsg);
    if (this.onsignal) {
      this.onsignal({username: this.username, peername: this.peername, msg: realmsg});
    }
  }
  handleSignal(signal) {
    var peer = this.getPeerConnection();
    if (signal.sdp) {
      console.log('Received ' + signal.type + ', setting remote description', signal.sdp);
      peer.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.candidate) {
      //this.debug.log('Received ICE candidate', signal);
      peer.addIceCandidate(new RTCIceCandidate(signal));
    }
    //console.log('SIGNAL', this.peername, this.username, signal);
  }
  handleIceCandidate(ev) {
    //this.debug.log('Sending ICE candidate', ev.candidate);
    var candidate = ev.candidate;
    this.signal(candidate);
  }
  handleAddStream(ev) {
    console.log('Peer connection added a stream', ev.stream);

/*
    if (!this.video) {
      this.video = document.createElement('video');
      this.appendChild(this.video);
    }
    this.video.srcObject = ev.stream;

    // Calling play will unmute the video and allow it to play at full framerate
    this.video.play();
*/
  }
  handleRemoveStream(ev) {
    console.log('Peer connection removed stream', ev);
/*
    if (this.video) {
      this.video.srcObject = null;
    }
*/
  }
  handleTrack(ev) {
    console.log('Peer connection sent a track event', ev);

/*
    if (!this.video) {
      this.video = document.createElement('video');
      this.appendChild(this.video);
    }
    this.video.srcObject = ev.streams[0];

    // Calling play will unmute the video and allow it to play at full framerate
    this.video.play();
*/
  }
  handleNegotiationNeeded(ev) {
    console.log('negotiation needed!', ev);
  }
  handleSignalingStateChange(ev) {
    //var peer = ev.target;
    var peer = this.getPeerConnection();

    this.signalstate = peer.signalingState;
    if (this.onsignalstatechange) {
      this.onsignalstatechange(this.signalstate);
    }
    if (peer.signalingState == 'have-remote-offer') {
      // Our remote peer sent us an offer, let's just go ahead and auto-accept it
      // TODO - if and when we implement client-side blacklisting, this is where it would go.
      this.receive(this.localstream);
    }
  }
  handleICEConnectionStateChange(ev) {
    //var peer = ev.target;
    var peer = this.getPeerConnection();

    this.state = peer.iceConnectionState;
    if (this.oniceconnectionstatechange) {
      this.oniceconnectionstatechange(this.state);
    }
    if (peer.iceConnectionState == 'checking') {
      //this.state = 'negotiating';
    } else if (peer.iceConnectionState == 'connected') {
      //this.state = 'connected';
    }
  }
}

