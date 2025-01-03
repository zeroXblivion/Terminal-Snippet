import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the github repository
*/
`;

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
    banner: {
        js: banner,
    },
    entryPoints: ["main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/state",
        "@codemirror/view",
        "@codemirror/language",
        ...builtins
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: "main.js",
});

if (prod) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
}
