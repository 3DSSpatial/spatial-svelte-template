import sha256 from 'sha256'

// This template provides a very simple authentication
// framework for building demos.
// A hardcoded password ("zea") is provided here in the code.
// The authentication can also be modified to support 3rd party
// tools such as Firebase, Auth0, etc.

// To disable authentication, set `shouldAuthenticate` to false.
const enableAuthentication = true
// Mocked password: "spatial"
// Rembember to generate a new one for your demo, here:
// https://xorbin.com/tools/sha256-hash-calculator
const HASHED_PASSWORD = 'b9e998b692bd644267de027a412e2cb7335a7e648f752f5995ce5ef427e6dbd2'

class Auth {
  async isAuthenticated() {
    if (shouldAuthenticate) {
      const userData = await this.getUserData()
      return userData && userData.hashedPassword === HASHED_PASSWORD
    }

    return true
  }

  async getUserData() {
    const { zeaUserData } = window.localStorage
    return zeaUserData && JSON.parse(zeaUserData)
  }

  async setUserData(userData) {
    if (shouldAuthenticate) {
      if (!userData.password) {
        throw new Error('Password not provided.')
      }

      userData.hashedPassword = sha256(userData.password)
      delete userData.password

      if (userData.hashedPassword !== HASHED_PASSWORD) {
        throw new Error('Wrong password.')
      }
    }

    window.localStorage.zeaUserData = JSON.stringify(userData)
  }

  async signOut() {
    localStorage.removeItem('zeaUserData')
  }
}

const auth = new Auth()

export { auth }
