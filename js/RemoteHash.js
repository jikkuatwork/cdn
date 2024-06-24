export default class RemoteHash {
  constructor({ db = "remotehash", org = "rollerblade", table = "store" }) {
    this.db = db
    this.org = org
    this.authToken = process.env.REMOTEHASH_AUTH_TOKEN
    this.table = table
  }

  randomId(chunkSize = 3, chunks = 3) {
    const getRandomChars = size => {
      let result = ""
      const characters = "abcdefghijkmnpqrstwxy3456789" // More exclusions for clarity
      for (let i = 0; i < size; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        )
      }
      return result
    }

    return Array.from({ length: chunks }, () => getRandomChars(chunkSize)).join(
      "-"
    )
  }

  async read(key) {
    const response = await this.execute(
      `select value from ${this.table} where key = :key`,
      [{ name: "key", value: { type: "text", value: key } }]
    )
    return this.clean(response)[0]?.value
  }

  async write({ key = this.randomId(), value }) {
    const response = await this.execute(
      `INSERT OR REPLACE INTO ${this.table} (key, value) VALUES (:key, :value);`,
      [
        { name: "key", value: { type: "text", value: key } },
        { name: "value", value: { type: "text", value: value } },
      ]
    )
    return this.clean(response)
  }

  url() {
    return `https://${this.db}-${this.org}.turso.io/v2/pipeline`
  }

  async execute(sql, namedArgs = []) {
    const requestBody = JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql: sql,
            named_args: namedArgs,
          },
        },
        { type: "close" },
      ],
    })

    const headers = {
      Authorization: `Bearer ${this.authToken}`,
      "Content-Type": "application/json",
    }

    const response = await fetch(this.url(), {
      method: "POST",
      headers: headers,
      body: requestBody,
    })

    try {
      const body = await response.text()
      return body
    } catch (e) {
      return e.message
    }
  }

  clean(response) {
    const parsed = JSON.parse(response)
    const final = parsed.results[0].response.result
    const columns = final.cols.map(i => i.name)
    const rows = final.rows.map(row => {
      return columns.reduce((acc, colName, index) => {
        acc[colName] = row[index].value
        return acc
      }, {})
    })
    return rows
  }

  async toHash() {
    const response = await this.execute(`SELECT * FROM ${this.table};`)
    return this.clean(response)
  }
}

class Runner {
  static async run() {
    const remoteHash = new RemoteHash({
      db: "remotehash",
      org: "rollerblade",
      table: "components",
    })
    // console.log(await remoteHash.read("recent-email"))
    // console.log(await remoteHash.write({ key: "dance", value: "salsa" }))
    console.log(await remoteHash.read("dance"))
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  Runner.run()
}
