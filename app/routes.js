var express = require('express');
var router = express.Router();

var globals = function(req, res, next) {
  res.locals.globals = {
    organisation: 'AlphaOrg',
    projects: [
      {
        title: 'New navigation',
        slug: 'new-navigation',
        desc: 'Testing new navigation with users'
      },
      {
        title: 'Search with filters',
        slug: 'search-with-filters',
        desc: 'Exploring problems with filtering our search'
      },
      {
        title: 'Benchmarks',
        slug: 'benchmarks',
        desc: 'Regular research rounds covering common tasks'
      }
    ],
    videos: [
      {
        participant: 'Andrew Gnomes',
        slug: 'andrew-gomes',
        length: '45m'
      },
      {
        participant: 'Andrew Gnomes',
        slug: 'andrew-gomes',
        length: '45m'
      }
    ]
  };

  return next();
};

router.get('/', globals, function (req, res) {
  res.render('index');
});

router.get('/projects', globals, function (req, res) {
  res.render('projects');
});

router.get('/projects/:project', globals, function (req, res) {
  var projectSlug = req.params.project,
      project = res.locals.globals.projects.find(function (p) { return p.slug === projectSlug });
  res.render('project', { project: project });
});

router.get('/projects/:project/:video', globals, function (req, res) {
  var projectSlug = req.params.project,
      videoSlug = req.params.video,
      project = res.locals.globals.projects.find(function (p) { return p.slug === projectSlug });
      video = res.locals.globals.videos.find(function (v) { return v.slug === videoSlug });

  res.render('video', { project: project, video: video });
});

// add your routes here
module.exports = router;
