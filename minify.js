import { minify } from "terser"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const directoryPath = path.join(__dirname, "./js")

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log("Unable to scan directory: " + err)
  }

  files.forEach(function (file) {
    const baseName = path.basename(file, ".js")
    if (path.extname(file) === ".js" && baseName && !file.endsWith(".min.js")) {
      const filePath = path.join(directoryPath, file)
      const code = fs.readFileSync(filePath, "utf8")

      minify(code)
        .then(result => {
          const minifiedFilePath = path.join(
            directoryPath,
            `${baseName}.min.js`
          )
          fs.writeFileSync(minifiedFilePath, result.code)
        })
        .catch(e => {
          console.log(`Failed to minify ${file}`, e)
        })
    }
  })
})
