module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/zlCart.js', 'src/zlCart.directives.js', 'src/zlCart.fulfilment.js'],
        dest: "dist/zl-cart.js"
      }
    },

    concat_css: {
      options: {},
      all: {
        src: ["src/*.css"],
        dest: "dist/zl-cart.css"
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
        src: 'dist/zl-cart.js',
        dest: "dist/zl-cart.min.js"
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

  grunt.registerTask('build', ['concat', 'uglify', 'concat_css', 'cssmin']);
  grunt.registerTask('default', ['build']);
};