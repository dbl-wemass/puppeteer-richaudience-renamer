const {
  execSync,
  exec
} = require('child_process'),
  chalk = require("chalk");
let
  comprobarC = () => {
    try {
      let comando = execSync(`(((powershell.exe /C TASKLIST /NH | grep -i -E vcxsrv.exe) && echo "1" || echo "0" ) | tail -n 1) &>/dev/null `, {
        encoding: "utf-8"
      });
      return comando.charAt(0) == "1";
    } catch (e) {
      if (verbose) {
        console.log(chalk.red("error checkeando comando"))
        console.log(e);
      }
      process.exit(-1);
    }
  },
  startX = (verbose) => {
    try {
      verbose && console.log(chalk.greenBright("wsl: iniciando X"));
      if (!comprobarC()) {
        let comando = execSync(`vcxsrv.exe :0 -ac -reset -terminate -lesspointer -multiwindow -clipboard -wgl -dpi auto &>/dev/null`, {
          encoding: "utf-8",
          input: "string",
          stdio: "inherit"
        });
      } else
        verbose && console.log(chalk.greenBright("x esta ya iniciado, no se hace nada"))
    } catch (e) {
      console.log(chalk.red("error iniando x"))
      console.log(e);
      process.exit(-1);
    }
  },
  stopX = (verbose) => {
    try {
      verbose && console.log(chalk.greenBright("wsl: parando X"));
      if (comprobarC()) {
        let comando = execSync(`powershell.exe "/C" "taskkill /T /F /IM vcxsrv.exe" &>/dev/null`, {
          encoding: "utf-8"
        });
        verbose && console.log(chalk.greenBright(comando));
      }
    } catch (e) {
      console.log(chalk.red("error parando x"))
      console.log(e);
      process.exit(-1);
    }
  };
module.exports = {
  startX,
  stopX
};