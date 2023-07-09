export class OpenAI {
  constructor(model) {
    this.model = model
  }

  url() {
    return `https://oai.toolbomber.com/${this.model}`
  }

  static async getResponse(prompt, model = "gpt3") {
    const openAI = new OpenAI(model)
    return await openAI.getResponse(prompt)
  }

  async getResponse(prompt) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: prompt,
    }

    try {
      const response = await fetch(this.url(), options)
      return await response.text()
    } catch (error) {
      console.error("Error: ", error)
    }
  }
}
