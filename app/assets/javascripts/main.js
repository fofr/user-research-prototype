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
    }
  }

  Modules.VideoPlayer = function VideoPlayer() {
    this.start = function start($element) {
      let hash = parseHash(window.location.hash);
      let startTime = hash.start || 0;
      let endTime = hash.end || 0;

      $element.on({
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
        },
        timeupdate: function (event) {
          $('body').trigger('video:timeupdate', {currentTime: this.currentTime });
          if (endTime && this.currentTime >= endTime) {
            this.pause();
            endTime = 0;
          }
          console.log('new time: ', this.currentTime);
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
  return `
  <div class="vc">
    <div class="vc-play">Play</div>
    <div class="vc-time">
      <span class="vc-min">00</span>:<span class="vc-sec">00</span>
    </div>
    <div class="vc-timeline">
      <div class="vc-buffer"></div>
      <div class="vc-current"></div>
      <div class="vc-range"></div>
    </div>
  </div>
  `;
}
