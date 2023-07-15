export class Cupboard {
  constructor(keys) {
    this.keys = keys
  }

  url = action => `https://shelf.toolbomber.com/api/${action}`

  append = async item => this.keys.append && this.trigger("append", item)

  replace = async item => this.keys.replace && this.trigger("replace", item)

  clear = async () => this.keys.replace && this.trigger("replace", [])

  read = async () => this.get()

  get = async () => {
    return await fetch(`${this.url("read")}/?key=${this.keys.read}`)
      .then(r => r.json())
      .catch(e => console.log(e))
  }

  static create = async seed =>
    new Cupboard((await Cupboard.generateKeys(seed)).keys)

  static generateKeys = async seed =>
    fetch(new Cupboard().url("create"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seed,
      }),
    })
      .then(response => response.json())
      .catch(error => {
        console.error("Error:", error)
      })

  trigger = async (action, data) =>
    fetch(this.url(action), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: this.keys[action],
        data: data,
      }),
    })
      .then(response => response.json())
      .catch(error => {
        console.error("Error:", error)
      })
}
