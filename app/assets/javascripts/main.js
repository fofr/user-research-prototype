(function (Modules) {
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
