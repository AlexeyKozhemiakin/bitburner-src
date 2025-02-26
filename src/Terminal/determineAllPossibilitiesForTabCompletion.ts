import { evaluateDirectoryPath, getAllParentDirectories } from "./DirectoryHelpers";
import { getSubdirectories } from "./DirectoryServerHelpers";

import { Aliases, GlobalAliases, substituteAliases } from "../Alias";
import { DarkWebItems } from "../DarkWeb/DarkWebItems";
import { Player } from "@player";
import { GetAllServers } from "../Server/AllServers";
import { Server } from "../Server/Server";
import { ParseCommand, ParseCommands } from "./Parser";
import { HelpTexts } from "./HelpText";
import { isScriptFilename } from "../Script/isScriptFilename";
import { compile } from "../NetscriptJSEvaluator";
import { Flags } from "../NetscriptFunctions/Flags";
import { AutocompleteData } from "@nsdefs";
import * as libarg from "arg";

// TODO: this shouldn't be hardcoded in two places with no typechecks to verify equivalence
// An array of all Terminal commands
const commands = [
  "alias",
  "analyze",
  "backdoor",
  "cat",
  "cd",
  "changelog",
  "check",
  "clear",
  "cls",
  "connect",
  "cp",
  "download",
  "expr",
  "free",
  "grow",
  "hack",
  "help",
  "home",
  "hostname",
  "ifconfig",
  "kill",
  "killall",
  "ls",
  "lscpu",
  "mem",
  "mv",
  "nano",
  "ps",
  "rm",
  "run",
  "scan-analyze",
  "scan",
  "scp",
  "sudov",
  "tail",
  "theme",
  "top",
  "vim",
  "weaken",
];

export async function determineAllPossibilitiesForTabCompletion(
  input: string,
  index: number,
  currPath = "",
): Promise<string[]> {
  input = substituteAliases(input);
  let allPos: string[] = [];
  allPos = allPos.concat(Object.keys(GlobalAliases));
  const currServ = Player.getCurrentServer();
  const homeComputer = Player.getHomeComputer();

  let parentDirPath = "";
  let evaledParentDirPath: string | null = null;
  // Helper functions
  function addAllCodingContracts(): void {
    for (const cct of currServ.contracts) {
      allPos.push(cct.fn);
    }
  }

  function addAllLitFiles(): void {
    for (const file of currServ.messages) {
      if (!file.endsWith(".msg")) {
        allPos.push(file);
      }
    }
  }

  function addAllMessages(): void {
    for (const file of currServ.messages) {
      if (file.endsWith(".msg")) {
        allPos.push(file);
      }
    }
  }

  function addAllPrograms(): void {
    for (const program of homeComputer.programs) {
      allPos.push(program);
    }
  }

  function addAllScripts(): void {
    for (const scriptFilename of currServ.scripts.keys()) {
      const res = processFilepath(scriptFilename);
      if (res) {
        allPos.push(res);
      }
    }
  }

  function addAllTextFiles(): void {
    for (const txt of currServ.textFiles) {
      const res = processFilepath(txt.fn);
      if (res) {
        allPos.push(res);
      }
    }
  }

  function addAllDirectories(): void {
    // Directories are based on the currently evaluated path
    const subdirs = getSubdirectories(currServ, evaledParentDirPath == null ? "/" : evaledParentDirPath);

    for (let i = 0; i < subdirs.length; ++i) {
      const assembledDirPath = evaledParentDirPath == null ? subdirs[i] : evaledParentDirPath + subdirs[i];
      const res = processFilepath(assembledDirPath);
      if (res != null) {
        subdirs[i] = res;
      }
    }

    allPos = allPos.concat(subdirs);
  }

  // Convert from the real absolute path back to the original path used in the input
  function convertParentPath(filepath: string): string {
    if (parentDirPath == null || evaledParentDirPath == null) {
      console.warn(`convertParentPath() called when paths are null`);
      return filepath;
    }

    if (!filepath.startsWith(evaledParentDirPath)) {
      console.warn(
        `convertParentPath() called for invalid path. (filepath=${filepath}) (evaledParentDirPath=${evaledParentDirPath})`,
      );
      return filepath;
    }

    return parentDirPath + filepath.slice(evaledParentDirPath.length);
  }

  // Given an a full, absolute filepath, converts it to the proper value
  // for autocompletion purposes
  function processFilepath(filepath: string): string | null {
    if (evaledParentDirPath) {
      if (filepath.startsWith(evaledParentDirPath)) {
        return convertParentPath(filepath);
      }
    } else if (parentDirPath !== "") {
      // If the parent directory is the root directory, but we're not searching
      // it from the root directory, we have to add the original path
      let t_parentDirPath = parentDirPath;
      if (!t_parentDirPath.endsWith("/")) {
        t_parentDirPath += "/";
      }
      return parentDirPath + filepath;
    } else {
      return filepath;
    }

    return null;
  }

  function isCommand(cmd: string): boolean {
    let t_cmd = cmd;
    if (!t_cmd.endsWith(" ")) {
      t_cmd += " ";
    }

    return input.startsWith(t_cmd);
  }

  // Autocomplete the command
  if (index === -1 && !input.startsWith("./")) {
    return commands.concat(Object.keys(Aliases)).concat(Object.keys(GlobalAliases));
  }

  // Since we're autocompleting an argument and not a command, the argument might
  // be a file/directory path. We have to account for that when autocompleting
  const commandArray = input.split(" ");
  if (commandArray.length === 0) {
    console.warn(`Tab autocompletion logic reached invalid branch`);
    return allPos;
  }
  const arg = commandArray[commandArray.length - 1];
  parentDirPath = getAllParentDirectories(arg);
  evaledParentDirPath = evaluateDirectoryPath(parentDirPath, currPath);
  if (evaledParentDirPath === "/") {
    evaledParentDirPath = null;
  } else if (evaledParentDirPath == null) {
    // do nothing for some reason tests don't like this?
    // return allPos; // Invalid path
  } else {
    evaledParentDirPath += "/";
  }

  if (isCommand("buy")) {
    const options = [];
    for (const i of Object.keys(DarkWebItems)) {
      const item = DarkWebItems[i];
      options.push(item.program);
    }

    return options.concat(Object.keys(GlobalAliases));
  }

  if (isCommand("scp") && index === 1) {
    for (const server of GetAllServers()) {
      allPos.push(server.hostname);
    }

    return allPos;
  }

  if (isCommand("scp") && index === 0) {
    addAllScripts();
    addAllLitFiles();
    addAllTextFiles();
    addAllDirectories();

    return allPos;
  }

  if (isCommand("cp") && index === 0) {
    addAllScripts();
    addAllTextFiles();
    addAllDirectories();
    return allPos;
  }

  if (isCommand("connect")) {
    // All directly connected and backdoored servers are reachable
    return GetAllServers()
      .filter(
        (server) =>
          currServ.serversOnNetwork.includes(server.hostname) || (server instanceof Server && server.backdoorInstalled),
      )
      .map((server) => server.hostname);
  }

  if (isCommand("nano") || isCommand("vim")) {
    addAllScripts();
    addAllTextFiles();
    addAllDirectories();

    return allPos;
  }

  if (isCommand("rm")) {
    addAllScripts();
    addAllPrograms();
    addAllLitFiles();
    addAllTextFiles();
    addAllCodingContracts();
    addAllDirectories();

    return allPos;
  }

  async function scriptAutocomplete(): Promise<string[] | undefined> {
    if (!isCommand("run") && !isCommand("tail") && !isCommand("kill") && !input.startsWith("./")) return;
    let copy = input;
    if (input.startsWith("./")) copy = "run " + input.slice(2);
    const commands = ParseCommands(copy);
    if (commands.length === 0) return;
    const command = ParseCommand(commands[commands.length - 1]);
    const filename = command[1] + "";
    if (!isScriptFilename(filename)) return; // Not a script.
    if (filename.endsWith(".script")) return; // Doesn't work with ns1.
    // Use regex to remove any leading './', and then check if it matches against
    // the output of processFilepath or if it matches with a '/' prepended,
    // this way autocomplete works inside of directories
    const script = currServ.scripts.get(filename);
    if (!script) return; // Doesn't exist.
    let loadedModule;
    try {
      //Will return the already compiled module if recompilation not needed.
      loadedModule = await compile(script, currServ.scripts);
    } catch (e) {
      //fail silently if the script fails to compile (e.g. syntax error)
      return;
    }
    if (!loadedModule || !loadedModule.autocomplete) return; // Doesn't have an autocomplete function.

    const runArgs = { "--tail": Boolean, "-t": Number };
    const flags = libarg(runArgs, {
      permissive: true,
      argv: command.slice(2),
    });
    const flagFunc = Flags(flags._);
    const autocompleteData: AutocompleteData = {
      servers: GetAllServers().map((server) => server.hostname),
      scripts: [...currServ.scripts.keys()],
      txts: currServ.textFiles.map((txt) => txt.fn),
      flags: (schema: unknown) => {
        if (!Array.isArray(schema)) throw new Error("flags require an array of array");
        pos2 = schema.map((f: unknown) => {
          if (!Array.isArray(f)) throw new Error("flags require an array of array");
          if (f[0].length === 1) return "-" + f[0];
          return "--" + f[0];
        });
        try {
          return flagFunc(schema);
        } catch (err) {
          return {};
        }
      },
    };
    let pos: string[] = [];
    let pos2: string[] = [];
    const options = loadedModule.autocomplete(autocompleteData, flags._);
    if (!Array.isArray(options)) throw new Error("autocomplete did not return list of strings");
    pos = pos.concat(options.map((x) => String(x)));
    return pos.concat(pos2);
  }
  const pos = await scriptAutocomplete();
  if (pos) return pos;

  // If input starts with './', essentially treat it as a slimmer
  // invocation of `run`.
  if (input.startsWith("./")) {
    // All programs and scripts
    for (const scriptFilename of currServ.scripts.keys()) {
      const res = processFilepath(scriptFilename);
      if (res) {
        allPos.push(res);
      }
    }

    for (const program of currServ.programs) {
      const res = processFilepath(program);
      if (res) {
        allPos.push(res);
      }
    }

    // All coding contracts
    for (const cct of currServ.contracts) {
      const res = processFilepath(cct.fn);
      if (res) {
        allPos.push(res);
      }
    }

    return allPos;
  }

  if (isCommand("run")) {
    addAllScripts();
    addAllPrograms();
    addAllCodingContracts();
    addAllDirectories();
  }

  if (isCommand("kill") || isCommand("tail") || isCommand("mem") || isCommand("check")) {
    addAllScripts();
    addAllDirectories();

    return allPos;
  }

  if (isCommand("cat")) {
    addAllMessages();
    addAllLitFiles();
    addAllTextFiles();
    addAllDirectories();
    addAllScripts();

    return allPos;
  }

  if (isCommand("download") || isCommand("mv")) {
    addAllScripts();
    addAllTextFiles();
    addAllDirectories();

    return allPos;
  }

  if (isCommand("cd")) {
    addAllDirectories();

    return allPos;
  }

  if (isCommand("ls") && index === 0) {
    addAllDirectories();
  }

  if (isCommand("help")) {
    // Get names from here instead of commands array because some
    // undocumented/nonexistent commands are in the array
    return Object.keys(HelpTexts);
  }

  return allPos;
}
