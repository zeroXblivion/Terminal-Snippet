/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the github repository
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TerminalSnippetsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  terminalStyles: {
    powershell: { background: "#012456" },
    cmd: { background: "#000000" },
    bash: { background: "#000000" }
  }
};
var TerminalSnippetsPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.codeBlockProcessorsRegistered = false;
  }
  // Gotta keep track of this so we don't register them a million times, I guess.
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TerminalSnippetsSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      if (!this.codeBlockProcessorsRegistered) {
        this.registerMarkdownCodeBlockProcessor("powershell-session", (source, el, ctx) => {
          this.renderTerminalBlock(source, el, "powershell", ctx);
        });
        this.registerMarkdownCodeBlockProcessor("cmd-session", (source, el, ctx) => {
          this.renderTerminalBlock(source, el, "cmd", ctx);
        });
        this.registerMarkdownCodeBlockProcessor("shell-session", (source, el, ctx) => {
          this.renderTerminalBlock(source, el, "bash", ctx);
        });
        this.codeBlockProcessorsRegistered = true;
      }
      this.highlightActiveLeaf();
    });
    this.app.workspace.on("file-open", () => {
      this.highlightActiveLeaf();
    });
    await this.refreshTerminalBlocks();
  }
  async highlightAll() {
    if (window.Prism) {
      window.Prism.highlightAllUnder(this.app.workspace.containerEl);
    }
  }
  // Only highlight the stuff the user is looking at right now. Save some resources, maybe?
  async highlightActiveLeaf() {
    var _a;
    const activeLeaf = (_a = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView)) == null ? void 0 : _a.containerEl;
    if (activeLeaf && window.Prism) {
      window.Prism.highlightAllUnder(activeLeaf);
    }
  }
  renderTerminalBlock(source, el, terminalType, ctx) {
    const container = el.createDiv({ cls: `terminal-snippet-container ${terminalType}-session` });
    const header = container.createDiv({ cls: "terminal-snippet-header" });
    const buttons = header.createDiv({ cls: "terminal-snippet-buttons" });
    buttons.createDiv({ cls: "terminal-btn close" });
    buttons.createDiv({ cls: "terminal-btn minimize" });
    buttons.createDiv({ cls: "terminal-btn maximize" });
    const titleContainer = header.createDiv({ cls: "terminal-snippet-title-container" });
    const title = titleContainer.createSpan({
      cls: "terminal-snippet-title",
      text: terminalType.toUpperCase()
    });
    title.setAttribute("contenteditable", "false");
    const editIcon = titleContainer.createDiv({ cls: "terminal-snippet-edit-icon" });
    editIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path fill="none" d="M0 0h24v24H0z"/><path d="M15.728 9.686l-1.414 1.414L18.914 17H21v-2.086zM6.375 17.713l-4.243 4.242L2.132 15.85 6.375 11.607zM17.829 7.586l-7.07 7.07L6.343 9.257l7.07-7.071z"/></svg>';
    editIcon.addEventListener("click", () => {
      title.setAttribute("contenteditable", "true");
      title.focus();
    });
    title.addEventListener("blur", () => {
      title.setAttribute("contenteditable", "false");
    });
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        title.blur();
      }
    });
    const content = container.createDiv({ cls: "terminal-snippet-content" });
    const style = this.settings.terminalStyles[terminalType];
    Object.assign(content.style, {
      backgroundColor: style.background
    });
    const pre = content.createEl("pre", {
      cls: `language-${terminalType}`
      // Important for Prism to know what language it is!
    });
    const code = pre.createEl("code");
    if (window.Prism) {
      if (terminalType === "cmd") {
        code.textContent = source;
      } else {
        const grammar = window.Prism.languages[terminalType];
        code.innerHTML = grammar ? window.Prism.highlight(source, grammar, terminalType) : source;
      }
    } else {
      code.textContent = source;
    }
  }
  // Removed createTerminalHighlightExtension() and its registration -  Good, that was confusing.
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // Refresh terminal blocks with updated styles - Modified to be more targeted. Hopefully this works better.
  async refreshTerminalBlocks() {
    const updateSnippetStyles = (container) => {
      container.querySelectorAll(".terminal-snippet-container").forEach((snippet) => {
        const content = snippet.querySelector(".terminal-snippet-content");
        if (content) {
          const match = snippet.className.match(/(powershell|cmd|bash)-session/);
          const terminalType = match ? match[1] : null;
          if (terminalType && this.settings.terminalStyles[terminalType]) {
            const backgroundColor = this.settings.terminalStyles[terminalType].background;
            content.style.backgroundColor = backgroundColor;
          }
        }
      });
    };
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof import_obsidian.MarkdownView) {
        const container = leaf.view.containerEl;
        updateSnippetStyles(container);
      }
    });
  }
};
var TerminalSnippetsSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Terminal Snippets Settings" });
    new import_obsidian.Setting(containerEl).setName("PowerShell Background Color").setDesc("Background color for PowerShell terminal blocks").addColorPicker((colorPicker) => {
      colorPicker.setValue(this.plugin.settings.terminalStyles.powershell.background).onChange(async (value) => {
        this.plugin.settings.terminalStyles.powershell.background = value;
      });
    });
    new import_obsidian.Setting(containerEl).setName("CMD Background Color").setDesc("Background color for CMD terminal blocks").addColorPicker((colorPicker) => {
      colorPicker.setValue(this.plugin.settings.terminalStyles.cmd.background).onChange(async (value) => {
        this.plugin.settings.terminalStyles.cmd.background = value;
      });
    });
    new import_obsidian.Setting(containerEl).setName("Bash Background Color").setDesc("Background color for Bash terminal blocks").addColorPicker((colorPicker) => {
      colorPicker.setValue(this.plugin.settings.terminalStyles.bash.background).onChange(async (value) => {
        this.plugin.settings.terminalStyles.bash.background = value;
      });
    });
    new import_obsidian.Setting(containerEl).addButton((button) => button.setButtonText("Save Changes").onClick(async () => {
      await this.plugin.saveSettings();
      await this.plugin.refreshTerminalBlocks();
    }));
  }
};
