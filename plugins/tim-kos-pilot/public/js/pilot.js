(function(window, document) {
  'use strict';

  var keymap = {
    87: {ev: 'move', action: 'front'}, // w
    83: {ev: 'move', action: 'back'}, // s
    65: {ev: 'move', action: 'left'}, // a
    68: {ev: 'move', action: 'right'}, // d
    38: {ev: 'move', action: 'up'}, // cursor up
    40: {ev: 'move', action: 'down'}, // cursor down
    37: {ev: 'move', action: 'counterClockwise'}, // cursor left
    39: {ev: 'move', action: 'clockwise'}, // cursor right
    84: {ev: 'drone', action: 'takeoff'}, // t
    76: {ev: 'drone', action: 'land'},  // l
    70: {ev: 'func', action: 'fire'}, // f
    71: {ev: 'animate', action: 'flipLeft', duration: 15}, // g
    72: {ev: 'animate', action: 'flipAhead', duration: 15}, // h
    67: {ev: 'animate', action: 'yawShake', duration: 2000}, // c
    80: {ev: 'animate', action: 'doublePhiThetaMixed', duration: 2000}, // p
    69: {ev: 'drone', action: 'disableEmergency'} // e
  };

  var Pilot = function Pilot(cockpit) {
    console.log("Loading Pilot plugin.");
    this.cockpit = cockpit;

    // Add the buttons to the control area
    $('#controls').append('<input type="button" id="ftrim" value="Flat trim">');
    $('#controls').append('<input type="button" id="calibratemagneto" value="Calibrate magneto">');

    // Start with magneto calibration disabled.
    $('#calibratemagneto').prop('disabled', true);

    this.listen();

    var self = this;
    setInterval(function() {
      self._sendCommands();
    }, 100);
  };

  Pilot.prototype._sendCommands = function() {
    for (var code in keymap) {
      var key = keymap[code];
      if (!key || !key.down) {
        continue;
      }

      if (key.ev === 'func') {
        return this.fire();
      }

      this._sendCommand("/pilot/" + key.ev, {
        action : key.action,
        speed : 1,
        duration: key.duration
      });
    }
  };

  Pilot.prototype.listen = function listen() {
    var self = this;

    $(document).keydown(function(e) {
      if (!keymap[e.keyCode]) {
        return;
      }

      keymap[e.keyCode].down = true;
      e.preventDefault();
    });

    $(document).keyup(function(e) {
      if (!keymap[e.keyCode]) {
        return;
      }

      keymap[e.keyCode].down = false;
      return self._sendCommand("/pilot/stop", {
        action: 'stop'
      });
    });

    $('#calibratemagneto').click(function(ev) {
      ev.preventDefault();
      self._sendCommand("/pilot/calibrate", {device_num : 0});
    });

    $('#ftrim').click(function(ev) {
      ev.preventDefault();
      self._sendCommand("/pilot/ftrim");
    });

    this.cockpit.socket.on('hovering', function() {
      $('#calibratemagneto').prop('disabled', false);
      $('#ftrim').prop('disabled', true);
    });
    this.cockpit.socket.on('landed', function() {
      $('#calibratemagneto').prop('disabled', true);
      $('#ftrim').prop('disabled', false);
    });
  };

  Pilot.prototype.fire = function() {
    setTimeout(function() {
      document.getElementById('fire_sound').play();
    }, 900);

    return this._sendCommand("/pilot/animateLeds", {
      action: 'fire',
      duration: 2000,
      hz: 5
    });
  };

  Pilot.prototype._sendCommand = function(cmd, opts) {
    opts = opts || {};
    this.cockpit.socket.emit(cmd, opts);
  };

  window.Cockpit.plugins.push(Pilot);
}(window, document));
