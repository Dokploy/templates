import yaml from "yaml";
import toml from "@iarna/toml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertYamlToToml(yamlContent) {
  const parsedYaml = yaml.parse(yamlContent);
  return toml.stringify(parsedYaml);
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === "template.yml") {
      console.log(`Converting ${filePath}`);
      const yamlContent = fs.readFileSync(filePath, "utf8");
      const tomlContent = convertYamlToToml(yamlContent);
      const tomlPath = path.join(dirPath, "template.toml");
      fs.writeFileSync(tomlPath, tomlContent);
    }
  });
}

// Ruta al directorio blueprints relativa al script
const blueprintsPath = path.join(__dirname, "..", "blueprints");
processDirectory(blueprintsPath);
