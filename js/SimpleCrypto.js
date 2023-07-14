export class SimpleCrypto {
  static async hash(message) {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle
    ) {
      // Browser
      let msgUint8 = new TextEncoder().encode(message)
      let hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8)
      let hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    } else {
      // Node.js
      const crypto = require("crypto")
      let hash = crypto.createHash("sha256")
      hash.update(message)
      return hash.digest("hex")
    }
  }

  static async getHashedKey(key) {
    let keyHash = await this.hash(key)
    return new TextEncoder().encode(keyHash).slice(0, 32)
  }

  static async encrypt(message, key) {
    let hashedKey = await this.getHashedKey(key)
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle
    ) {
      // Browser
      let cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        hashedKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      )
      let iv = window.crypto.getRandomValues(new Uint8Array(12))
      let data = new TextEncoder().encode(message)
      let encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv, tagLength: 128 },
        cryptoKey,
        data
      )
      let combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)
      return combined.reduce(
        (str, byte) => str + byte.toString(16).padStart(2, "0"),
        ""
      )
    } else {
      // Node.js
      const crypto = require("crypto")
      let iv = crypto.randomBytes(12)
      let cipher = crypto.createCipheriv("aes-256-gcm", hashedKey, iv)
      let encrypted = Buffer.concat([
        cipher.update(message, "utf8"),
        cipher.final(),
      ])
      let tag = cipher.getAuthTag()
      return Buffer.concat([iv, encrypted, tag]).toString("hex")
    }
  }

  static async decrypt(encryptedMessage, key) {
    try {
      let hashedKey = await this.getHashedKey(key)
      if (
        typeof window !== "undefined" &&
        window.crypto &&
        window.crypto.subtle
      ) {
        // Browser
        let cryptoKey = await window.crypto.subtle.importKey(
          "raw",
          hashedKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        )
        let bytes = new Uint8Array(
          encryptedMessage.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        )
        let iv = bytes.slice(0, 12)
        let encrypted = bytes.slice(12)
        let decrypted = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv },
          cryptoKey,
          encrypted
        )
        return new TextDecoder().decode(decrypted)
      } else {
        // Node.js
        const crypto = require("crypto")
        let data = Buffer.from(encryptedMessage, "hex")
        let iv = data.slice(0, 12)
        let encryptedText = data.slice(12, data.length - 16)
        let tag = data.slice(data.length - 16)
        let decipher = crypto.createDecipheriv("aes-256-gcm", hashedKey, iv)
        decipher.setAuthTag(tag)
        let decrypted = Buffer.concat([
          decipher.update(encryptedText),
          decipher.final(),
        ])
        return decrypted.toString("utf8")
      }
    } catch (error) {
      // Decryption failed, return null
      return null
    }
  }
}
