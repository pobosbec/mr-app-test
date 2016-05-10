module.exports = function (grunt) {

    function getTodaysDate() {
        var currentDate = new Date();
        return currentDate.toISOString().split('T')[0];
    }

    var todaysDate = getTodaysDate();

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        copy: {
            build: {
                cwd: 'www',
                src: ['**'],
                dest: 'build',
                expand: true
            }
        },
        clean: ['build/', 'buildzip/'],
        aws: grunt.file.readJSON('credentials.json'), // Load deploy variables
        aws_s3: {
            options: {
                accessKeyId: '<%= aws.AWSAccessKeyId %>',
                secretAccessKey: '<%= aws.AWSSecretKey %>',
                region: 'eu-west-1',
                uploadConcurrency: 5, // 5 simultaneous uploads
                downloadConcurrency: 5,//, // 5 simultaneous downloads
                bucket: 'app.aws.mobileresponse.se',
                access: 'public-read',
                progress: 'dots'
            },
            push: {
                options: {
                    debug: false,
                    overwrite: true
                },
                files: [
                    { expand: true, cwd: 'build/', src: ['**'], dest: '/', action: 'upload' },
                    { expand: true, cwd: 'buildzip/', src: ['**'], dest: '/Backup/' + todaysDate, action: 'upload' }
                ]
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'buildzip/' + todaysDate + '.zip'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'www/',
                        src: '**'
                    }
                ]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-aws-s3');
    grunt.loadNpmTasks('grunt-contrib-compress');

    // Default task(s).
    //grunt.registerTask('default', ['uglify']);
    grunt.registerTask('publish', ['clean', 'copy', 'compress', 'aws_s3:push', 'clean']);
    grunt.registerTask('clear', ['clean']);
};