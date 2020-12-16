const env = require('dotenv').config()
const gulp = require('gulp')
const git = require('gulp-git')

let file

const commiting = () => {
    console.log('+----------------------------------------------+')
    console.log('starting commiting')
    git.add({ cwd: env.parsed.FOLDER_WATCHED })
    console.log('git add')
    git.commit(
        `${env.parsed.HISTORY_JIRA} | ${file} | ${env.parsed.HISTORY_DESCRIPTION}`,
        { cwd: env.parsed.FOLDER_WATCHED }
    )
    console.log('git commit')
}

const merging = () => {
    console.log('finishing commiting')
    console.log('+----------------------------------------------+\n\n')
    console.log('starting merging')
    const merge = (err) => {
        if(err) return err;
    }

    const pullBranch = (err) => {
        if(err) return err;
        git.pull(
            'origin',
            env.parsed.ACTUAL_BRANCH, 
            { cwd: env.parsed.FOLDER_WATCHED }, 
            (err) => merge(err)
        )
    }

    git.checkout(
        'merge',
        { args:'-b', cwd: env.parsed.FOLDER_WATCHED },
        (err) => pullBranch(err)
    )
}

const deploying = () => {
    console.log('finishing merging')
    console.log('+----------------------------------------------+\n\n')

    console.log('starting deploying')

    console.log('finishing deploying')
    console.log('+----------------------------------------------+\n\n')
}

exports.default = () => {
    return gulp.watch([env.parsed.FOLDER_WATCHED + '/**/*.*'])
        .on("all", (event, file, status) => {
            file = file.slice(file.lastIndexOf('\\') + 1)
            console.log('event', event)
            // console.log('file', file)
            // console.log('status', status)

            commiting()
            merging()
            deploying()
        })
}