const fs = require("fs");
const path = require("path");
const filepath = path.join(__dirname, "../CMakeLists.txt");
const cmds = fs
  .readFileSync(filepath)
  .toString("UTF8")
  .split(/\r?\n/g);

["wasm", "asm"].forEach(v => {
  let index = cmds.indexOf(`#<-----${v}----->`);
  if (index > -1) {
    if (cmds[index + 1].indexOf("#") != 0) {
      cmds[index + 1] = `#${cmds[index + 1]}`;
    }
  }
});

let type = process.argv[2];
index = cmds.indexOf(`#<-----${type}----->`);
if (index > -1) {
  cmds[index + 1] = cmds[index + 1].replace("#", "");
}

fs.writeFileSync(filepath, cmds.join("\n"));
