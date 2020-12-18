const env = require('dotenv').config()
const gulp = require('gulp')
const git = require('gulp-git')
const { exec } = require("child_process")

const commiting = async () => {
    console.log('+----------------------------------------------+')
    console.log('+-- Starting commiting')
    return new Promise(resolve =>{
        console.log('git commit')
        // console.log(fileUrl);

        const nameCommit = `${env.parsed.HISTORY_NAME} | ${fileName} | ${env.parsed.HISTORY_DESCRIPTION}`;
        exec(
            `cd ${env.parsed.FOLDER_WATCHED} && git commit -am "${nameCommit}"`,
            (err, stdout)=> {
                console.log(stdout)
                if(stdout.indexOf('nothing to commit') === -1){
                    resolve(true)
                }
                console.log("+-- Nothing to commit")
                resolve(false)
            }
        )
    })
}

const merging = (res) => {
    console.log('+-- Finishing commiting')
    console.log('+----------------------------------------------+\n\n')
    if(!res && typeof res === 'boolean') return new Promise((resolve)=>{resolve(false)})
    
    return new Promise((resolve)=>{
        console.log('+-- Starting merging')
        git.checkout(
            'merge',
            { args:'-b', cwd: env.parsed.FOLDER_WATCHED },
            (err) => resolve(err)
        )
    }).then(err=>{
        return new Promise(resolve=>{
            if(err) {
                console.error(err)
            }
            git.pull(
                'origin',
                env.parsed.ACTUAL_BRANCH, 
                { args: '-f', cwd: env.parsed.FOLDER_WATCHED }, 
                (err) => resolve(err)
            )
        })
    }).then(err=>{
        if(err) {
            console.error(err)
        }
        return new Promise(resolve=>{
            git.checkout(
                env.parsed.ACTUAL_BRANCH,
                { cwd: env.parsed.FOLDER_WATCHED },
                (err) => {
                    if(err) {
                        console.error(err)
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
                        }
                        resolve()
                    } 
                )
            })
        })
    })
    
}

const deploying = (res) => {
    if(!res && typeof res === 'boolean') return new Promise((resolve)=>{resolve(false)})
    
    return new Promise((resolve)=>{
        console.log('finishing merging')
        console.log('+----------------------------------------------+\n\n')
        console.log('starting deploying') 
        git.push(
            'origin',
            env.parsed.ACTUAL_BRANCH.toString(), 
            { cwd: env.parsed.FOLDER_WATCHED }, 
            (err) => {
                if(err) {
                    resolve(err)
                    console.error(err)
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
                    }
                    resolve()
                }
            )
        })
    }).then(()=>{
        console.log('finishing deploying')
        console.log('+----------------------------------------------+\n\n')
    })
}

exports.default = () => {
    gulp.watch([env.parsed.FOLDER_WATCHED + '/**/*.*'])
        .on("all", (event, file, status) => {
            fileUrl = file
            fileName = file.slice(file.lastIndexOf('\\') + 1)
            console.log('event', event)
            // console.log('file', file)
            // console.log('status', status)
            commiting()
                .then((res)=>merging(res))
                .then((res)=>deploying(res))
        })
}