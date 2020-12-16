const gulp = require('gulp')
const git = require('gulp-git')

const pull = (origin, branch) =>{
    git.pull(origin, branch, function (err) {
        //if (err) ...
    });
}

const push = (origin, branch) =>{
    git.push(origin, branch, function (err) {
        //if (err) ...
    });
}

const createBranchMerge = () => {
    git.checkout('merge', {args:'-b'}, function (err) {

    });
}

const merge = (branch) => {
    git.merge(branch, function (err) {
        //if (err) ...
    })
}

const commiting = (message) => {
    return new Promise((resolve)=>{
        git.add()
        git.commit(message)
    })
}

const merging = (message) => {
    const merge = () =>{

    }

    return new Promise((resolve)=>{
        git.checkout('merge', {args:'-b'}, () => merge());
    })
}

const deploying = (message) => {
    return new Promise((resolve)=>{
        git.add()
        git.commit(message)
        resolve(process.env.ACTUAL_BRANCH)
    })
}


module.exports = () => {
    return commiting()
            .then(merging)
            .then(deploying)
            .then(() => console.log('Sucesso'))
            .catch(err=> console.error(err))
}