// console.log(process.stdin)

const processArgs = process.argv.splice(2)
const firstCommand = processArgs[0]
console.log('process args', processArgs)

function processCommand(command) {
    if (firstCommand === 'add') {
        addTask()
    } else if (firstCommand === 'list') {
        listTasks()
    } else {
        help()
    }
}

function addTask() {
    console.log('add task')
}

function listTasks() {
    console.log('list tasks')
}

function help() {
    console.log('help')
}

processCommand(firstCommand)