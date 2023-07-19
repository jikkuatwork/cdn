interface Keys {
  [key: string]: string
}

export class Cupboard {
  static API_URL = "http://localhost:3000/api"
  static SHORT_HASH_LENGTH = 6

  seed: string
  keys: Keys

  constructor(seed: string, keys: Keys) {
    this.seed = seed
    this.keys = keys
  }

  read = async () => {
    let response = {}

    if (this.keys.read) {
      response = await Cupboard.get("read", { key: this.keys.read })

      if (response.error) {
        throw new Error("Unauthorized: Bad key")
      } else {
        return response.payload
      }
    } else {
      throw new Error("Unauthorized: `read` key missing")
    }
  }

  append = async (item: any) => {
    let response = {}

    if (this.keys.append) {
      response = await Cupboard.post("append", {
        key: this.keys.append,
        data: item,
      })

      if (response.error) {
        throw new Error("Unauthorized: Bad key")
      } else {
        return response.payload
      }
    } else {
      throw new Error("Unauthorized: `append` key missing")
    }
  }

  replace = async (item: any) => {
    let response = {}

    if (this.keys.replace) {
      response = await Cupboard.post("replace", {
        key: this.keys.replace,
        data: item,
      })

      if (response.error) {
        throw new Error("Unauthorized: Bad key")
      } else {
        return response.payload
      }
    } else {
      throw new Error("Unauthorized: `replace` key missing")
    }
  }

  static generateKeys = async (seed: string) =>
    await Cupboard.post("create", { seed })

  static post = async (route: string, parameters: object) => {
    const url = `${Cupboard.API_URL}/${route}`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parameters),
      })

      const data = await response.json()

      return data
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error)
    }
  }

  static get = async (route: string, parameters: object) => {
    const query = new URLSearchParams(
      parameters as Record<string, string>
    ).toString()

    const url = `${Cupboard.API_URL}/${route}?${query}`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      return data
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error)
    }
  }
}
