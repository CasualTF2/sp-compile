import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import glob from "glob";

const basePath = process.argv.slice(2).join(" ");
/** @type {string[]} */
const includePaths = fs
	.readFileSync("INCLUDE_PATHS.txt", "utf8")
	.split("\n")
	.map((l) => path.join(basePath, l.replace(/\r/g, "").trim()))
	.filter((l) => l.length > 0);
/** @type {string[]} */
const sourceFiles = fs
	.readFileSync("SOURCE_FILES.txt", "utf8")
	.split("\n")
	.map((l) => l.replace(/\r/g, "").trim())
	.filter((l) => l.length > 0)
	.map((line) => glob.sync(path.join(basePath, line), { nodir: true, absolute: true }))
	.flat()
	.filter((l) => typeof l === "string" && l.endsWith(".sp"));
let outputPath = fs.readFileSync("OUTPUT_PATH.txt", "utf8").replace(/[\r\n]/g, "");
if (outputPath.length <= 0) {
	outputPath = undefined;
	console.log("Output path: Same directory as source file");
} else {
	outputPath = path.join(basePath, outputPath);
	console.log(`Output path: ${outputPath}`);

	fs.mkdirSync(outputPath, {
		recursive: true
	});
}

console.log(`Include paths: ${includePaths.join(", ")}`);

for (const file of sourceFiles) {
	console.log(`Compiling: ${file}`);

	const parsed = path.parse(file);

	childProcess.execSync(
		[
			"spcomp",
			file, // Input file
			"-E", // Treat warnings as errors
			"-O2", // Optimization level (0=none, 2=full)
			"-v2", // Verbosity level; 0=quiet, 1=normal, 2=verbose
			`-i${process.env.includePath}`, // SourcePawn include path from setup-sp
			includePaths.map((i) => `-i${i}`), // INclude paths
			`-o ${outputPath || parsed.dir}/${parsed.base.replace(".sp", ".smx")}` // Output path, either from input or same as source file
		]
			.flat()
			.join(" "),
		{
			encoding: "utf8",
			stdio: "pipe"
		}
	);
}
