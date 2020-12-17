class Auth {
  async isAuthenticated() {
    return this.getUserData()
  }

  async getUserData() {
    const { zeaUserData } = window.localStorage
    return zeaUserData && JSON.parse(zeaUserData)
  }

  async setUserData(userData) {
    window.localStorage.zeaUserData = JSON.stringify(userData)
  }

  async signOut() {
    localStorage.removeItem('zeaUserData')
  }
}

const auth = new Auth()

export { auth }
