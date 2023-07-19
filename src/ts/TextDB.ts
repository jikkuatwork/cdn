export class TextDB {
  static API_URL: string = "https://textdb.dev/api/data"
  key: string

  constructor(key?: string) {
    this.key = key || this.randomKey(3)
  }

  static read = async (key: string) => new TextDB(key).read()

  static write = async (key: string, text: string) =>
    new TextDB(key).write(text)

  static url = (key: string) => new TextDB(key).url()

  static randomKey = () => new TextDB().randomKey()

  getReadOnlyLink = async (): Promise<string> => {
    return `${TextDB.API_URL}/${await this.getReadOnlyKey()}`
  }

  getReadOnlyKey = async (): Promise<string | null> => {
    const PAGE_URL = "https://textdb.dev/data"

    const extractReadOnlyKey = (html: string) => {
      const regex =
        /<section class="data-api">[\s\S]*?<a href="https:\/\/textdb\.dev\/data\/([^"]*)">[\s\S]*?<\/section>/
      const match = html.match(regex)
      if (match) {
        return match[1]
      }
      return null
    }

    const response = await fetch(`${PAGE_URL}/${this.key}`, {
      method: "GET",
    })

    return extractReadOnlyKey(await response.text())
  }

  read = async (): Promise<string> => {
    const response = await fetch(`${TextDB.API_URL}/${this.key}`)
    return response.text()
  }

  write = async (text: string): Promise<Response> => {
    return fetch(`${TextDB.API_URL}/${this.key}`, {
      body: text,
      headers: { "Content-Type": "text/plain" },
      method: "POST",
    })
  }

  url = (): string => TextDB.API_URL + "/" + this.key

  randomKey = (n: number = 3): string => {
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
