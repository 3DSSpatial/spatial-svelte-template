import sha256 from 'sha256'

// Mocked password(1234), please generate a new for your demo
const HASHED_PASSWORD = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'

class Auth {
  async isAuthenticated() {
    return this.getUserData()
  }

  async getUserData() {
    const { zeaUserData } = window.localStorage
    return zeaUserData && JSON.parse(zeaUserData)
  }

  async setUserData(userData) {
    const hashedPassword = sha256(userData.password)
    if (hashedPassword !== HASHED_PASSWORD) return Promise.reject(new Error('Invalid Password'))
    
    window.localStorage.zeaUserData = JSON.stringify(userData)
  }

  async signOut() {
    localStorage.removeItem('zeaUserData')
  }
}

const auth = new Auth()

export { auth }
