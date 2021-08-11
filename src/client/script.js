const login = document.querySelector('#login')
const register = document.querySelector('#register')
const forgot = document.querySelector('#forgot')
const reset = document.querySelector('#reset')
const logout = document.querySelector('#logout')

const userInfo = document.querySelector('#user-info .data')
const userList = document.querySelector('#user-list .data')

const toast = document.querySelector('#toast')

const handleResponse = (response) => {
  if (response.status < 300) return response.json()
  if (response.json) return response.json().then((json) => {
    throw new Error(json.error || json)
  })
  throw new Error(response.statusText)
}

const showMessage = (message, type) => {
  toast.textContent = message
  toast.className = `active ${type}`
  setTimeout(() => toast.classList.remove('active'), 3000)
}

const getUserInfoList = (user) => {
  const userData = {
    name: user.firstName,
    surname: user.lastName,
    email: user.email,
  }
  const userDataList = document.createElement('ul')
  Object.entries(userData).forEach(([key, value]) => {
    userDataList.innerHTML += `<li><b>${key}:</b> ${value}</li>`
  })
  return userDataList
}

const displayUserList = () => {
  const authorization = localStorage.getItem('token')
  fetch('/api/user/list', { headers: { 'Authorization': authorization } })
    .then(handleResponse)
    .then((response) => {
      response.users.forEach((user) => {
        userList.innerHTML += getUserInfoList(user).outerHTML
      })
    })
    .catch((error) => showMessage(error.message, 'danger'))
}

const displayUser = () => {
  const authorization = localStorage.getItem('token')
  fetch('/api/user', { headers: { 'Authorization': authorization } })
    .then(handleResponse)
    .then((response) => {
      userInfo.innerHTML = getUserInfoList(response.user).outerHTML

      userList.innerHTML = ''
      if (response.user.role === 'ROLE_ADMIN') displayUserList()
    })
    .catch((error) => {
      showMessage(error.message, 'danger')
      localStorage.removeItem('token')
    })
}

login.onsubmit = (event) => {
  event.preventDefault()
  const email = document.querySelector('#login [type="email"]').value
  const password = document.querySelector('#login [type="password"]').value

  fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(handleResponse)
    .then((response) => {
      showMessage(`User ${response.user.email} is logged in.`, 'success')
      localStorage.setItem('token', response.token)
      displayUser()
    })
    .catch((error) => showMessage(error.message, 'danger'))
}

register.onsubmit = (event) => {
  event.preventDefault()
  const email = document.querySelector('#register [name="email"]').value
  const firstName = document.querySelector('#register [name="firstName"]').value
  const lastName = document.querySelector('#register [name="lastName"]').value
  const password = document.querySelector('#register [name="password"]').value

  fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, firstName, lastName, password }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(handleResponse)
    .then((response) => showMessage(response.message, 'success'))
    .catch((error) => showMessage(error.message, 'danger'))
}

forgot.onsubmit = (event) => {
  event.preventDefault()
  const email = document.querySelector('#forgot [name="email"]').value

  fetch('/api/auth/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(handleResponse)
    .then((response) => showMessage(response.message, 'success'))
    .catch((error) => showMessage(error.message, 'danger'))
}

reset.onsubmit = (event) => {
  event.preventDefault()
  const urlParams = new URLSearchParams(window.location.search)
  const resetPasswordId = urlParams.get('resetPasswordId')
  const password = document.querySelector('#reset [name="password"]').value

  fetch(`/api/auth/reset/${resetPasswordId}`, {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(handleResponse)
    .then((response) => {
      showMessage(response.message, 'success')
      window.history.replaceState({}, document.title, '/')
      window.location.hash = 'login'
    })
    .catch((error) => showMessage(error.message, 'danger'))
}

logout.onclick = () => {
  userInfo.innerHTML = ''
  userList.innerHTML = ''
  localStorage.removeItem('token')
}

if (localStorage.getItem('token')) displayUser()
