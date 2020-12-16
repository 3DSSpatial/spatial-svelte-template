class Auth {
  async isAuthenticated() {
    const { zeaUserData } = window.localStorage
    
    return (zeaUserData != undefined && zeaUserData != null)
  }

  async getUsername() {
    const { username } = window.localStorage

    return username
  }

  async getUserData() {
    const { zeaUserData } = window.localStorage
    return JSON.parse(zeaUserData)
  }

  async setUsername(username) {
    window.localStorage.username = username
  }

  async setUserData(userData) {
    window.localStorage.zeaUserData = JSON.stringify(userData)
  }
}

const auth = new Auth()

export { auth }
