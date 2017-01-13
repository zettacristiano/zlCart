// grunt build
// grunt karma:unit:start watch
// grunt karma:once


module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/zlCart.js', 'src/zlCart.directives.js', 'src/zlCart.fulfilment.js'],
        dest: "dist/zlCart.js"
      }
    },

    concat_css: {
      options: {},
      all: {
        src: ["src/*.css"],
        dest: "dist/zlCart.css"
      }
    },

    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'dist',
          src: ['*.css', '!*.min.css'],
          dest: 'dist',
          ext: '.min.css'
        }]
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> */\n <%= pkg.url %>'
      },
      dist: {
        src: 'dist/zlCart.js',
        dest: "dist/zlCart.min.js"
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true
      },
      once: {
        configFile: 'karma.conf.js',
        singleRun: true
      },
      travis: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      }
    },

    watch: {
      karma: {
        files: ['src/**/*.js'],
        tasks: ['karma:unit:run']
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-concat-css');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('build', ['concat', 'uglify', 'concat_css', 'cssmin']);
  grunt.registerTask('devmode', ['karma:unit', 'watch']);
  grunt.registerTask('testunit', ['karma:unit']);
  grunt.registerTask('test', ['karma:travis']);

  grunt.registerTask('default', ['test', 'build']);
};