// console.log(process.stdin)
const file = require("./file");
const path = require('path');

const tasksPath = path.join(__dirname, "tasks.json")
const processArgs = process.argv.splice(2);
const firstCommand = processArgs[0];
console.log("process args", processArgs);

const consoleColors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

async function processCommand(command, args) {
  try {
    if (command === "add") {
      const firstArg = args[0];
      const secondArg = args[1];
      await addTask(firstArg, secondArg);
    } else if (command === "list") {
      const firstArg = args[0];
      await listTasks(firstArg);
    } else if (command === "delete") {
      const firstArg = args[0];
      await deleteTask(firstArg);
    } else if (command === "update") {
      const id = args[0];
      let description = undefined
      let status = undefined
      for(let arg of args.slice(1)) {
        if(arg.startsWith("--description=")) {
          description = arg.split("=")[1]
        } else if(arg.startsWith("--status=")) {
          status = arg.split("=")[1]
        }
      }
      await updateTask(id, {
        description,
        status
      })
    } else if (command === "mark-done") {
      const firstArg = args[0];
      await markTaskAsDone(firstArg);
    } else if (command === "mark-in-progress") {
      const firstArg = args[0];
      await markTaskAsInProgress(firstArg);
    } else {
      help();
    }
  } catch (error) {
    console.log(`${consoleColors.red}${error.message}`);
  }
}

/**
 * Loads all tasks from the tasks.json file and returns them as an array of objects.
 * If the file is empty, returns an empty array.
 * @returns {Promise<object[]>} A promise that resolves with an array of tasks.
 */
async function loadAllTasks() {
  const fileReturn = await file.readFile(tasksPath);
  return new Promise((resolve, reject) => {
    const tasks = [];
    fileReturn.data((data) => {
    //   console.log("loadAllTasks:data", JSON.parse(data));
      tasks.push(...JSON.parse(data));
    });
    fileReturn.end(() => {
    //   console.log("loadAllTasks:end", tasks);
      resolve(tasks);
    });
    fileReturn.error((err) => {
      console.log("loadAllTasks:error", err);
      reject(err);
    });
  });
}

/**
 * Loads all tasks from the tasks.json file and returns the highest id.
 * If the file is empty, returns undefined.
 * @param {object[]} tasks An array of tasks.
 * @returns {number | undefined} The highest id of all tasks in the tasks.json file.
 */
async function getTasksLastId(tasks) {
  return tasks.sort((a, b) => b.id - a.id)?.[0]?.id;
}

function validateStatus(status) {
  return ["todo", "in-progress", "done"].includes(status);
}
/**
 * Adds a task to the tasks.json file.
 * @param {string} description The description of the task.
 * @param {'todo' | 'done' | 'in-progress'} [status='todo'] The status of the task.
 */
async function addTask(description, status = "todo") {
  if (!description) {
    throw new Error("Please provide a description for the task");
  }
  if (!validateStatus(status)) {
    throw new Error("Invalid status. Please provide 'todo', 'in-progress', or 'done'");
  }
  const tasks = await loadAllTasks();
  const lastId = await getTasksLastId(tasks);

  const newTask = {
    id: lastId ? lastId + 1 : 1,
    description,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  tasks.push(newTask);
  await file.writeFile(tasksPath, tasks);

  console.log(`Task added successfully (ID: ${newTask.id})`);
}

async function listTasks(status) {
  const tasks = await loadAllTasks();
  const filteredTasks = tasks.filter((task) => {
    if (status) {
      return task.status === status;
    }
    return true;
  })
  const sortedTasks = filteredTasks.sort((a, b) => b.id - a.id);
  console.log(sortedTasks.map((task) => `ID: ${task.id}, Description: ${task.description}, Status: ${task.status}, Created At: ${new Date(task.createdAt).toLocaleString()}, Updated At: ${new Date(task.updatedAt).toLocaleString()}`).join("\n"));
}

async function deleteTask(id) {
  if (!id || !Number.isInteger(Number(id))) {
    throw new Error("Please provide an valid ID for the task to delete");
  }
  const tasks = await loadAllTasks();
  const filteredTasks = tasks.filter((task) => Number(task.id) !== Number(id));
  await file.writeFile(tasksPath, filteredTasks);
  console.log(`Task ${id} deleted successfully`);
}

async function updateTask(id, { description, status }) {
  if (!id || !Number.isInteger(Number(id))) {
    throw new Error("Please provide an valid ID for the task to update");
  }
  if (status && !validateStatus(status)) {
    throw new Error("Invalid status. Please provide 'todo', 'in-progress', or 'done'");
  }
  const tasks = await loadAllTasks();
  const task = tasks.find((task) => Number(task.id) === Number(id));
  if (!task) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const updatedTasks = tasks.map((task) => {
    if (Number(task.id) === Number(id)) {
      return {
        ...task,
        description: description || task.description,
        status: status || task.status,
        updatedAt: Date.now(),
      };
    }
    return task;
  });
  await file.writeFile(tasksPath, updatedTasks);
  console.log(`Task ${id} updated successfully`);
}

async function markTaskAsDone(id) {
  const tasks = await loadAllTasks();
  const task = tasks.find(t => Number(t.id) === Number(id))
  if (!task) {
    throw new Error(`Task with ID ${id} not found`)
  }
  if (task.status === "done") {
    throw new Error(`Task with ID ${id} is already done`)
  }
  task.status = "done"
  await file.writeFile(tasksPath, tasks)
  console.log(`Task ${id} marked as done`)
}

async function markTaskAsInProgress(id) {
  if (!id || !Number.isInteger(Number(id))) {
    throw new Error("Please provide an valid ID");
  }
  const tasks = await loadAllTasks();
  const task = tasks.find(t => Number(t.id) === Number(id))
  if (!task) {
    throw new Error(`Task with ID ${id} not found`)
  }
  if (task.status === "in-progress") {
    throw new Error(`Task with ID ${id} is already in progress`)
  }
  task.status = "in-progress"
  await file.writeFile(tasksPath, tasks)
  console.log(`Task ${id} marked as in progress`)
}

function help() {
  console.log(`
  Task Tracker CLI 
  
  Commands:
  add <description> [status]                                - Add a new task
  list [status]                                             - List all tasks, you can filter by status. Status can be todo, in-progress, or done
  delete <id>                                               - Delete a task
  update <id> --description=[description] --status=[status] - Update a task
  mark-done <id>                                            - Mark a task as done
  mark-in-progress <id>                                     - Mark a task as in progress
  `);
}

processCommand(firstCommand, processArgs.slice(1))