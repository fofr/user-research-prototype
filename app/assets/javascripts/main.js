(function (Modules) {
  Modules.Notes = function Notes() {
    this.start = function start($element) {
      $element.on('submit', 'form', addNote);
      $element.on('keyup', 'textarea', submit);

      // TODO:
      // Pause video when typing
      // Resume video when no longer typing
      // Timestamp: X seconds behind

      function submit(evt) {
        if (evt.key === 'Enter') {
          $element.find('form').trigger('submit');
        }
      }

      function addNote(evt) {
        evt.preventDefault();

        var note = $(this).find('textarea').val();

        $element.find('.notes').prepend(`
          <div class="note">
            <a href="#start=20" class="note-timestamp">1m20</a>
            <div class="note-content" contenteditable>${note}</div>
            <div class="note-meta">– Paul H</div>
          </div>
          `)

        $(this).find('textarea').val('').focus();
      }
    }
  }

  Modules.VideoPlayer = function VideoPlayer() {
    this.start = function start($element) {
      let range = parseHash(window.location.hash);
      let startTime = 0;
      $element.on({
        abort: function () {
          console.log('playback aborted');
        },
        canplay: function () {
          console.log('video can play');
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
          console.log('loaded metadata');
        },
        timeupdate: function (event) {
          console.log('new time: ', this.currentTime);
        }
      });
    }
  };
  SimpleBe.modules.start();
})(window.SimpleBe.Modules);

function parseHash(str) {
  str = str.replace(/^#/, '');
}
