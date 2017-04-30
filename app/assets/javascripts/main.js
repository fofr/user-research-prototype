(function (Modules) {
  Modules.Notes = function Notes() {
    this.start = function start($element) {
      $element.on('submit', 'form', addNote);
      $element.on('keyup', 'textarea', whenTyping);

      var $noteTimestamp = $element.find('.js-note-timestamp');
      var currentTime = '0:00';
      var typingTimeout;
      var typingInterval;

      $('body').on('video:timeupdate', updateNoteTimestamp);

      function updateNoteTimestamp(evt, data) {
        time = Math.ceil(data.currentTime);
        currentTime = '0:' + (time < 10 ? '0' + time : time);
        $noteTimestamp.text(currentTime);
      }

      function updateVideoStatus(status) {
        $element.find('.js-video-status').html(status);
      }

      function whenTyping(evt) {
        seconds = 10;

        if (evt.key === 'Enter') {
          $element.find('form').trigger('submit');
        } else {
          $('body').trigger('note:typing');
          updateVideoStatus(`Video paused. Resuming in ${seconds}s`);

          clearInterval(typingInterval);
          typingInterval = setInterval(function() {
            seconds--;
            updateVideoStatus(`Video paused. Resuming in ${seconds}s`);

            if (seconds <= 1) {
              clearInterval(typingInterval);
            }
          }, 1000);

          clearTimeout(typingTimeout);
          typingTimeout = setTimeout(function() {
            $('body').trigger('note:stopped-typing');
            updateVideoStatus('');
          }, 10000)
        }
      }

      function addNote(evt) {
        evt.preventDefault();

        var note = $(this).find('textarea').val();

        $element.find('.notes').prepend(`
          <div class="note">
            <a href="#start=${currentTime.split(':')[1]}" class="note-timestamp"><span class="glyphicon glyphicon-film"></span> ${currentTime}</a>
            <div class="note-content" contenteditable>${note}</div>
            <div class="note-meta">– Paul H</div>
          </div>
          `)

        $(this).find('textarea').val('').focus();

        clearInterval(typingInterval);
        clearTimeout(typingTimeout);
        updateVideoStatus('');
        $('body').trigger('note:stopped-typing');
      }
    };
  };

  Modules.VideoPlayer = function VideoPlayer() {
    this.start = function start($element) {
      var video = $element.find('video')[0];
      var hash = parseHash(window.location.hash);
      var startTime = hash.start || 0;
      var endTime = hash.end || 0;
      var controls = new PlayerControls(video);

      $element.append(controls.el);

      $(video).on({
        abort: function () {
          console.log('playback aborted');
        },
        canplay: function () {
          console.log('video can play');
          if (startTime) {
            this.play();
            startTime = 0;
          }
        },
        duration: function (event) {
          console.log('duration has changed: ', event);
        },
        error: function (event) {
          console.log('error playing video');
        },
        loadeddata: function (event) {
          console.log('first frame loaded');
        },
        loadedmetadata: function (event) {
          if (startTime) {
            this.currentTime = startTime;
          }
          if (startTime || endTime) {
            controls.setRange(startTime, endTime || this.duration);
          }
        },
        timeupdate: function (event) {
          $('body').trigger('video:timeupdate', {currentTime: this.currentTime });
          if (endTime && this.currentTime >= endTime) {
            this.pause();
            this.currentTime = endTime;
            endTime = 0;
          }
        }
      });

      $('body').on('note:typing', function() {
        $element.get(0).pause();
      });

      $('body').on('note:stopped-typing', function() {
        $element.get(0).play();
      });
    }
  };
  SimpleBe.modules.start();
})(window.SimpleBe.Modules);

function parseHash(str) {
  str = str.replace(/^#/, '');
  return str.split('&').reduce(function (obj, param) {
    let parts = param.split('=');
    obj[parts[0]] = parts[1];
    return obj;
  }, {});
}

function createControls() {
  var html = `
  <div class="vc">
    <div class="vc-play">Play</div>
    <div class="vc-time">00:00</div>
    <div class="vc-timeline">
      <div class="vc-buffer"></div>
      <div class="vc-current"></div>
      <div class="vc-range"></div>
    </div>
  </div>
  `;
  var parser = new DOMParser();
  var doc = parser.parseFromString(html, "text/html");
  return doc.body.firstChild;
}

function PlayerControls(video) {
  video.controls = false;
  var el = createControls();
  var playEl = el.querySelector('.vc-play');
  var timelineEl = el.querySelector('.vc-timeline');
  var currentTimeEl = el.querySelector('.vc-time');
  var bufferEl = el.querySelector('.vc-buffer');
  var currentProgressEl = el.querySelector('.vc-current');
  var rangeEl = el.querySelector('.vc-range');
  var mouseDownPoint = null

  this.el = el;

  video.addEventListener('timeupdate', function (evt) {
    // Skip while dragging...
    if (lastPosition) { return }
    updateProgress();
  }.bind(this), false);

  video.addEventListener('seeking', function (evt) {
    // Skip while dragging...
    updateProgress();
  }.bind(this), false);

  video.addEventListener('progress', function (evt) {
    updateBuffer();
  }.bind(this), false);

  video.addEventListener('pause', function (evt) {
    updatePlayState();
  }.bind(this), false);

  video.addEventListener('playing', function (evt) {
    updatePlayState();
  }.bind(this), false);

  playEl.addEventListener('click', function () {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, false);

  var root = document.documentElement;
  var lastPosition = null;

  function pixelsToTime(px) {
    let percent = px / timelineEl.offsetWidth;
    return video.duration * percent;
  }

  function seek(time) {
    video.currentTime = Math.min(Math.max(0, time), video.duration);
  }

  // function updateCursorBy(increment) {
  //   let newPositon = Math.max(0, Math.min(video.duration, currentPosition + increment));
  //   let percent = newPositon / video.duration;
  //   currentProgressEl.style.width = `${percent * 100}%`;
  //   currentPosition = newPositon;
  //   updateTime(currentPosition);
  // }

  function setCursor(time) {
    time = Math.max(0, time);
    let percent = (time / video.duration);
    currentProgressEl.style.width = `${percent * 100}%`;
    // currentPosition = time;
    updateTime(time);
  }

  function setRange(startTime, endTime) {
    var startPercentage = startTime / video.duration;
    var endPercentage = endTime / video.duration;
    var widthPercentage = endPercentage - startPercentage;
    rangeEl.style.left = `${startPercentage * 100}%`;
    rangeEl.style.width = `${widthPercentage * 100}%`;
  }
  this.setRange = setRange;

  function handleMouseDown(event) {
    video.pause();

    root.addEventListener('mousemove', handleMouseMove);
    root.addEventListener('mouseup', handleMouseUp);

    lastPosition = {
      x: event.clientX,
      y: event.clientY,
    };

    var time = pixelsToTime(event.offsetX);
    seek(time);
    setCursor(time);
  }

  function handleMouseMove(event) {
    if (!lastPosition) { return }
    var xOffset = event.clientX - lastPosition.x;
    lastPosition = {x: event.clientX, y: event.clientY};

    let timeIncrement = pixelsToTime(xOffset);
    // updateCursorBy(timeIncrement);
    seek(video.currentTime + timeIncrement);
  }

  function handleMouseUp(event) {
    if (!lastPosition) { return }
    var xOffset = event.clientX - lastPosition.x;
    lastPosition = {x: event.clientX, y: event.clientY};

    let timeIncrement = pixelsToTime(xOffset);
    seek(video.currentTime + timeIncrement);

    lastPosition = null
    root.removeEventListener('mousemove', handleMouseMove);
    root.removeEventListener('mouseup', handleMouseUp);
  }

  timelineEl.addEventListener('mousedown', handleMouseDown);

  function updatePlayState () {
    playEl.textContent = video.paused ? 'Play' : 'Pause';
  };

  function updateTime(time) {
    let hrs = Math.floor(time / 3600);
    let min = Math.floor((time - (hrs * 3600)) / 60);
    let sec = Math.floor((time - (hrs * 3600) - (min * 60)));

    currentTimeEl.textContent = `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  }

  function updateProgress() {
    setCursor(video.currentTime);
  }

  function updateBuffer() {
    // TODO:(aron) handle multiple buffered ranges
    let startPercentage = 0;
    let endPercentage = 0;

    for (var idx = 0; idx < video.buffered.length; idx++) {
      startPercentage = Math.min(startPercentage, video.buffered.start(idx) / video.duration);
      endPercentage = Math.max(endPercentage, video.buffered.end(idx) / video.duration);
    }

    bufferEl.style.left = `${startPercentage * 100}%`
    bufferEl.style.width = `${endPercentage * 100}%`
  }

  updatePlayState();
  updateProgress();
  updateBuffer();

}

function pad(int) {
  if (int < 10) {
    return `0${int}`
  }
  return String(int);
}
