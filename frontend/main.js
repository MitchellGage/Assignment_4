const api = 'http://127.0.0.1:8000';
let token = localStorage.getItem('access_token') || null;

document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    document.getElementById("auth-container").style.display = "flex";
    document.querySelector(".app").style.display = "none";
  } else {
    document.getElementById("auth-container").style.display = "none";
    document.querySelector(".app").style.display = "block";
    getTasks();
  }
});

document.getElementById("form-login").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!username || !password) {
    document.getElementById("login-error").textContent = "Please fill in all fields.";
    return;
  }
  
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  fetch(`${api}/users/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString()
  })
  .then(response => response.json().then(data => ({ status: response.status, data })))
  .then(result => {
    if (result.status === 200 && result.data.access_token) {
      localStorage.setItem("access_token", result.data.access_token);
      token = result.data.access_token;
      document.getElementById("auth-container").style.display = "none";
      document.querySelector(".app").style.display = "block";
      getTasks();
    } else {
      document.getElementById("login-error").textContent = result.data.detail || "Login failed.";
    }
  })
  .catch(err => {
    document.getElementById("login-error").textContent = "Error connecting to server.";
  });
});

document.getElementById("form-register").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const email = document.getElementById("register-email").value.trim();

  if (!username || !password || !email) {
    document.getElementById("register-error").textContent = "Please fill in all fields.";
    return;
  }

  fetch(`${api}/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email })
  })
  .then(response => response.json().then(data => ({ status: response.status, data })))
  .then(result => {
    if (result.status === 200 || result.status === 201) {
      document.getElementById("register-error").style.color = "green";
      document.getElementById("register-error").textContent = "Registration successful! Please login.";
      toggleToLogin();
    } else {
      document.getElementById("register-error").textContent = result.data.detail || "Registration failed.";
    }
  })
  .catch(err => {
    document.getElementById("register-error").textContent = "Error connecting to server.";
  });
});

document.getElementById("toggle-to-register").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-form-container").style.display = "none";
  document.getElementById("register-form-container").style.display = "block";
  document.getElementById("login-error").textContent = "";
});
document.getElementById("toggle-to-login").addEventListener("click", (e) => {
  e.preventDefault();
  toggleToLogin();
});

function toggleToLogin(){
  document.getElementById("register-form-container").style.display = "none";
  document.getElementById("login-form-container").style.display = "block";
  document.getElementById("register-error").textContent = "";
}

let titleInput = document.getElementById('title');
let descInput = document.getElementById('desc');
let taskTitle = document.getElementById('task-title');
let times = document.getElementById('time');
let data = [];
let selectedTask = {};

let addTask = (title, description, time) => {
  title = title.trim();
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      const newTask = JSON.parse(xhr.responseText);
      data.push(newTask);
      titleInput.value = '';
      descInput.value = '';
      refreshTasks();
    }
  };
  xhr.open('POST', `${api}/tasks`, true);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.send(JSON.stringify({ title, description, time }));
};

document.getElementById('form-add').addEventListener('submit', (e) => {
  e.preventDefault();
  let check = true;
  for (let i = 0; i < data.length; i++) {
    if (titleInput.value == data[i].title) {
      document.getElementById('msg').innerHTML = 'There is already a task with this title.';
      check = false;
    }
  }
  if (titleInput.value == '') {
    document.getElementById('msg').innerHTML = 'Task needs a title';
  } else if (titleInput.value.length > 30) {
    document.getElementById('msg').innerHTML = (titleInput.value.length - 30).toString() + " character(s) too long. Max 30.";
  } else if (titleInput.value.includes("?")) {
    document.getElementById('msg').innerHTML = 'Cannot contain "?"';
  } else if (check) {
    let date = new Date();
    let hour = date.getHours();
    let Hour = ' AM';
    if (hour >= 12) {
      hour = hour - 12;
      Hour = ' PM';
    }
    if (hour == 0) {
      hour = 12;
    }
    let time = format(date.getMonth() + 1) + '/' +
      format(date.getDate()) + '/' + format(date.getFullYear()) +
      ' ' + hour.toString() + ':' + format(date.getMinutes()) + Hour;
    addTask(titleInput.value, descInput.value, time);
    hideModal('modal-add');
  }
});

function format(time) {
  return time < 10 ? '0' + time.toString() : time.toString();
}

let tasks = document.getElementById('tasks');
let refreshTasks = () => {
  document.getElementById('msg').innerHTML = '';
  tasks.innerHTML = '';
  data.map((x) => {
    let color = (x.title).slice(-1);
    if (color == '!') {
      color = 'lightcoral';
    } else if (color == '.') {
      color = 'lightyellow';
    } else {
      color = 'lightgreen';
    }
    tasks.innerHTML += `
      <div style="background-color: ${color};" id="task-${x.title}">
        <div style="font-weight: bold; font-size: 1.4rem;">${x.title}</div>
        <div style="font-size: 1.1rem; padding-left: 20px;">${x.description.split('\n').join('<br>')}</div>
        <div style="display: flex; justify-content: center; align-items: flex-end; gap: 8px;">
          <button onclick="editTask('${x.title}')" style="font-size: 1rem;">Edit</button>
          <button onclick="deleteTask('${x.title}')" style="font-size: 1rem;">Delete</button>
          <label style="display: inline-block; font-size: 1.2rem; cursor: text;">${x.time}</label>
        </div>
      </div>
    `;
  });
};

let titleEditInput = document.getElementById('title-edit');
let descEditInput = document.getElementById('desc-edit');
let editTask = (title) => {
  const task = data.find((x) => x.title == title);
  selectedTask = task;
  taskTitle.innerText = task.title;
  times.innerText = task.time;
  titleEditInput.value = task.title;
  descEditInput.value = task.description;
  showModal('modal-edit');
};

document.getElementById('form-edit').addEventListener('submit', (e) => {
  e.preventDefault();
  let check = true;
  let title = titleEditInput.value.trim();
  let description = descEditInput.value;
  for (let i = 0; i < data.length; i++) {
    if (title === data[i].title && title !== selectedTask.title) {
      check = false;
    }
  }
  if (title !== '' && check && title.length < 30 && !title.includes("?")) {
    const xhr = new XMLHttpRequest();
    let time = selectedTask.time;
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        selectedTask.title = title;
        selectedTask.description = description;
        refreshTasks();
      }
    };
    xhr.open('PUT', `${api}/tasks/${selectedTask.title}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.send(JSON.stringify({ title, description, time }));
    hideModal('modal-edit');
  } else {
    console.log('Invalid input. Max 30 char, cannot contain "?", cannot be empty, cannot already exist.');
  }
});

let deleteTask = (title) => {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      data = data.filter((x) => x.title != title);
      refreshTasks();
    }
  };
  xhr.open('DELETE', `${api}/tasks/${title}`, true);
  if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.send();
};

let clearTasks = () => {
  for (let i = 0; i < data.length; i++) {
    deleteTask(data[i].title);
  }
};

let getTasks = () => {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      data = JSON.parse(xhr.responseText) || [];
      refreshTasks();
    }
  };
  xhr.open('GET', `${api}/tasks`, true);
  if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.send();
};

let showModal = (id) => {
  document.getElementById(id).classList.add('show');
}

let hideModal = (id) => {
  document.getElementById(id).classList.remove('show');
}