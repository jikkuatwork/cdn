export class TextDB {
  static API_URL = "https://textdb.dev/api/data"

  constructor(key) {
    this.key = key || this.randomKey(3)
  }

  static read = async key => new TextDB(key).read()

  static write = async (key, text) => new TextDB(key).write(text)

  static url = key => new TextDB(key).url()

  static randomKey = () => new TextDB().randomKey()

  static getReadOnlyKey = async key => new TextDB(key).getReadOnlyKey()

  static getReadOnlyLink = async key => new TextDB(key).getReadOnlyLink()

  getReadOnlyLink = async () =>
    `${TextDB.API_URL}/${await this.getReadOnlyKey()}`

  getReadOnlyKey = async () => {
    const PAGE_URL = "https://textdb.dev/data"

    const extractReadOnlyKey = html => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")
      const linkElement = doc.querySelector(".data-api a")
      if (linkElement) {
        const href = linkElement.href
        const parts = href.split("/")
        return parts[parts.length - 1]
      }
      return null
    }

    return await fetch(`${PAGE_URL}/${this.key}`, {
      method: "GET",
    })
      .then(r => r.text())
      .then(t => extractReadOnlyKey(t))
  }

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
