export class TextDB {
  static API_URL = "https://textdb.dev/api/data"

  constructor(key) {
    this.key = key || this.randomKey(3)
  }

  static read = async key => new TextDB(key).read()

  static write = async (key, text) => new TextDB(key).write(text)

  static url = key => new TextDB(key).url()

  static randomKey = () => new TextDB().randomKey()

  read = async () => {
    return await fetch(`${TextDB.API_URL}/${this.key}`)
      .then(r => r.text())
      .then(r => r)
  }

  write = async text => {
    return fetch(`${TextDB.API_URL}/${this.key}`, {
      body: text,
      headers: { "Content-Type": "text/plain" },
      method: "POST",
    })
  }

  url = () => TextDB.API_URL + "/" + this.key

  randomKey = (n = 3) => {
    let chars = "abcdefghjkmnpqrstuvwxyz"
    let result = ""
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < n; j++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
      if (i < 2) result += "-"
    }

    return result
  }
}
