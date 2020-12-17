const env = require('dotenv').config()
const gulp = require('gulp')
const git = require('gulp-git')
const { exec } = require("child_process");

let fileName, fileUrl, watcher

const commiting = () => {
    watcher.close();
    watcher = null
    console.log('+----------------------------------------------+')
    console.log('starting commiting')
    return new Promise(resolve =>{
        console.log('git commit')
        console.log(fileUrl);

        const nameCommit = `${env.parsed.HISTORY_NAME} | ${fileName} | ${env.parsed.HISTORY_DESCRIPTION}`;
        exec(
            `cd ${env.parsed.FOLDER_WATCHED} && git commit -am "${nameCommit}"`,
            ()=> resolve()
        )
    })
}

const merging = () => {
    console.log('finishing commiting')
    console.log('+----------------------------------------------+\n\n')
    console.log('starting merging')

    return new Promise(resolve=>{
        git.checkout(
            'merge',
            { args:'-b', cwd: env.parsed.FOLDER_WATCHED },
            (err) => resolve(err)
        )
    }).then(err=>{
        if(err) {
            console.error(err)
            return watcher.close()
        }
        return new Promise(resolve=>{
            git.pull(
                'origin',
                env.parsed.ACTUAL_BRANCH, 
                { cwd: env.parsed.FOLDER_WATCHED }, 
                (err) => resolve(err)
            )
        })
    }).then(err=>{
        if(err) {
            console.error(err)
            return watcher.close()
        }

        return new Promise(resolve=>{
            git.checkout(
                env.parsed.ACTUAL_BRANCH,
                { cwd: env.parsed.FOLDER_WATCHED },
                (err) => {
                    if(err) {
                        console.error(err)
                        return watcher.close()
                    }
                    resolve()
                }
            ) 
        })
        .then(()=>{
            return new Promise(resolve=>{
                exec(
                    `cd ${env.parsed.FOLDER_WATCHED} && git rebase merge -f`,
                    (err, stdout) => {
                        if(err) {
                            console.error(err)
                            return watcher.close()
                        }
                        resolve();
                    }
                )
            })  
        })
        .then(()=>{
            return new Promise(resolve=>{
                git.branch(
                    'merge',
                    { args: '-d', cwd: env.parsed.FOLDER_WATCHED },  
                    (err) => { 
                        if(err) {
                            console.error(err)
                            return watcher.close()
                        }
                        resolve()
                    } 
                )
            })
        })
    })
    
}

const deploying = () => {
    console.log('finishing merging')
    console.log('+----------------------------------------------+\n\n')

    console.log('starting deploying')
    return new Promise(resolve=>{
        git.push(
            'origin',
            env.parsed.ACTUAL_BRANCH.toString(), 
            { cwd: env.parsed.FOLDER_WATCHED }, 
            (err) => {
                if(err) {
                    console.error(err)
                    return watcher.close()
                }
                resolve()
            }
        )
    }).then(()=>{
        return new Promise(resolve=>{
            exec(
                `cd ${env.parsed.FOLDER_WATCHED} && sfdx force:source:deploy --sourcepath ${fileUrl} --json --loglevel fatal`,
                (err) => {
                    if(err) {
                        console.error(err)
                        return watcher.close()
                    }
                    resolve()
                }
            )
        })
    }).then(()=>{
        console.log('finishing deploying')
        console.log('+----------------------------------------------+\n\n')
        watcher = gulp.watch([env.parsed.FOLDER_WATCHED + '/**/*.*'])
        .on("all", (event, file, status) => {
            fileUrl = file
            fileName = file.slice(file.lastIndexOf('\\') + 1)
            console.log('event', event)
            // console.log('file', file)
            // console.log('status', status)

            commiting()
                .then(()=>merging())
                .then(()=>deploying())
        })
    })
}

exports.default = () => {
    return watcher = gulp.watch([env.parsed.FOLDER_WATCHED + '/**/*.*'])
    .on("all", (event, file, status) => {
        fileUrl = file
        fileName = file.slice(file.lastIndexOf('\\') + 1)
        console.log('event', event)
        // console.log('file', file)
        // console.log('status', status)

        commiting()
            .then(()=>merging())
            .then(()=>deploying())
    })
}