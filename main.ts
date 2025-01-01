import { Plugin, PluginSettingTab, App, Setting, MarkdownView } from 'obsidian';
import { syntaxTree } from '@codemirror/language'; // uh, is this even being used?  The example didn't really explain this...
import { RangeSetBuilder } from '@codemirror/state'; // Need to look this up later... or never.
import { Decoration, EditorView } from '@codemirror/view'; // More stuff I kinda just copied. Hopefully it's important.

interface TerminalSnippetsSettings {
    terminalStyles: {
        powershell: { background: string };
        cmd: { background: string };
        bash: { background: string };
    };
}

const DEFAULT_SETTINGS: TerminalSnippetsSettings = {
    terminalStyles: {
        powershell: { background: '#012456' },
        cmd: { background: '#000000' },
        bash: { background: '#000000' },
    }
};

export default class TerminalSnippetsPlugin extends Plugin {
    settings: TerminalSnippetsSettings;
    codeBlockProcessorsRegistered = false; // Gotta keep track of this so we don't register them a million times, I guess.

    async onload() {
        await this.loadSettings();

        // Setting tab stuff
        this.addSettingTab(new TerminalSnippetsSettingTab(this.app, this));

        // Register the code block processors WHEN the layout is ready. Makes sense, right?
        this.app.workspace.onLayoutReady(() => {
            if (!this.codeBlockProcessorsRegistered) {
                // Updated terminal calls
                this.registerMarkdownCodeBlockProcessor('powershell-session', (source, el, ctx) => {
                    this.renderTerminalBlock(source, el, 'powershell', ctx);
                });
                this.registerMarkdownCodeBlockProcessor('cmd-session', (source, el, ctx) => {
                    this.renderTerminalBlock(source, el, 'cmd', ctx);
                });
                this.registerMarkdownCodeBlockProcessor('shell-session', (source, el, ctx) => {
                    this.renderTerminalBlock(source, el, 'bash', ctx);
                });
                this.codeBlockProcessorsRegistered = true;
            }
            this.highlightActiveLeaf(); // Let's make it look pretty after we're done setting up
        });

        // Re-highlight when a file opens. Trying to be efficient here.
        this.app.workspace.on('file-open', () => {
            this.highlightActiveLeaf();
        });

        // Need to make sure the styles are up-to-date. Important!
        await this.refreshTerminalBlocks();
    }

    async highlightAll() {
        if (window.Prism) {
            (window.Prism as any).highlightAllUnder(this.app.workspace.containerEl);
        }
    }

    // Only highlight the stuff the user is looking at right now. Save some resources, maybe?
    async highlightActiveLeaf() {
        const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.containerEl;
        if (activeLeaf && window.Prism) {
            (window.Prism as any).highlightAllUnder(activeLeaf);
        }
    }

    private renderTerminalBlock(
        source: string,
        el: HTMLElement,
        terminalType: 'powershell' | 'cmd' | 'bash',
        ctx: any // Context, whatever that REALLY is...
    ) {
        // The main box for the terminal
        const container = el.createDiv({ cls: `terminal-snippet-container ${terminalType}-session` });

        // The top part that looks like a window
        const header = container.createDiv({ cls: 'terminal-snippet-header' });
        const buttons = header.createDiv({ cls: 'terminal-snippet-buttons' });
        buttons.createDiv({ cls: 'terminal-btn close' });
        buttons.createDiv({ cls: 'terminal-btn minimize' });
        buttons.createDiv({ cls: 'terminal-btn maximize' });

        // Where the title goes, and the edit icon too!
        const titleContainer = header.createDiv({ cls: 'terminal-snippet-title-container' });
        const title = titleContainer.createSpan({
            cls: 'terminal-snippet-title',
            text: terminalType.toUpperCase(),
        });
        title.setAttribute('contenteditable', 'false');

        const editIcon = titleContainer.createDiv({ cls: 'terminal-snippet-edit-icon' });
        editIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path fill="none" d="M0 0h24v24H0z"/><path d="M15.728 9.686l-1.414 1.414L18.914 17H21v-2.086zM6.375 17.713l-4.243 4.242L2.132 15.85 6.375 11.607zM17.829 7.586l-7.07 7.07L6.343 9.257l7.07-7.071z"/></svg>';

        editIcon.addEventListener('click', () => {
            title.setAttribute('contenteditable', 'true');
            title.focus();
        });

        title.addEventListener('blur', () => {
            title.setAttribute('contenteditable', 'false');
            // Maybe save the title later?  Not sure if needed yet.
        });

        title.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                title.blur();
            }
        });

        // The actual space where the code goes
        const content = container.createDiv({ cls: 'terminal-snippet-content' });

        // Setting the background color based on what's in the settings
        const style = this.settings.terminalStyles[terminalType];
        Object.assign(content.style, {
            backgroundColor: style.background,
        });

        // The <pre> and <code> tags for the code itself. Prism needs this.
        const pre = content.createEl('pre', {
            cls: `language-${terminalType}`, // Important for Prism to know what language it is!
        });
        const code = pre.createEl('code');

        if (window.Prism) {
            if (terminalType === 'cmd') {
                code.textContent = source; // Just plain text for cmd, I guess.
            } else {
                // Try to highlight the code if Prism knows the language
                const grammar = window.Prism.languages[terminalType];
                code.innerHTML = grammar
                    ? window.Prism.highlight(source, grammar, terminalType)
                    : source; // If not, just show the plain text.
            }
        } else {
            code.textContent = source; // If Prism isn't loaded, just show the raw code.
        }
    }

    // Removed createTerminalHighlightExtension() and its registration -  Good, that was confusing.

    async loadSettings() {
        // Load saved settings, or use the defaults if there aren't any yet.
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Refresh terminal blocks with updated styles - Modified to be more targeted. Hopefully this works better.
    async refreshTerminalBlocks() {
        const updateSnippetStyles = (container: HTMLElement) => {
            container.querySelectorAll('.terminal-snippet-container').forEach(snippet => {
                const content = snippet.querySelector('.terminal-snippet-content') as HTMLElement | null;

                if (content) {
                    const match = snippet.className.match(/(powershell|cmd|bash)-session/);
                    const terminalType = match ? match[1] as keyof TerminalSnippetsSettings['terminalStyles'] : null;

                    if (terminalType && this.settings.terminalStyles[terminalType]) {
                        const backgroundColor = this.settings.terminalStyles[terminalType].background;
                        content.style.backgroundColor = backgroundColor;
                    }
                }
            });
        };

        // Go through all the open notes and update the styles.
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView) {
                const container = leaf.view.containerEl;
                updateSnippetStyles(container);
            }
        });
    }
}

/**
 * Plugin settings tab -  Where you configure the plugin. Duh.
 */
class TerminalSnippetsSettingTab extends PluginSettingTab {
    plugin: TerminalSnippetsPlugin;

    constructor(app: App, plugin: TerminalSnippetsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty(); // Clear out the settings pane

        containerEl.createEl('h2', { text: 'Terminal Snippets Settings' });

        // PowerShell settings
        new Setting(containerEl)
            .setName('PowerShell Background Color')
            .setDesc('Background color for PowerShell terminal blocks')
            .addColorPicker(colorPicker => {
                colorPicker
                    .setValue(this.plugin.settings.terminalStyles.powershell.background)
                    .onChange(async (value) => {
                        this.plugin.settings.terminalStyles.powershell.background = value;
                    });
            });

        // CMD settings
        new Setting(containerEl)
            .setName('CMD Background Color')
            .setDesc('Background color for CMD terminal blocks')
            .addColorPicker(colorPicker => {
                colorPicker
                    .setValue(this.plugin.settings.terminalStyles.cmd.background)
                    .onChange(async (value) => {
                        this.plugin.settings.terminalStyles.cmd.background = value;
                    });
            });

        // Bash settings
        new Setting(containerEl)
            .setName('Bash Background Color')
            .setDesc('Background color for Bash terminal blocks')
            .addColorPicker(colorPicker => {
                colorPicker
                    .setValue(this.plugin.settings.terminalStyles.bash.background)
                    .onChange(async (value) => {
                        this.plugin.settings.terminalStyles.bash.background = value;
                    });
            });

        new Setting(containerEl)
            .addButton(button => button
                .setButtonText("Save Changes")
                .onClick(async () => {
                    await this.plugin.saveSettings();
                    await this.plugin.refreshTerminalBlocks(); // Need to redraw them when settings change
                }));
    }
}
