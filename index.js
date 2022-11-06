import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import glob from "glob";

const basePath = process.argv.slice(2).join(" ");
/** @type {string[]} */
const excludePaths = fs
	.readFileSync("EXCLUDE_PATHS.txt", "utf8")
	.split("\n")
	.map((l) => l.replace(/\r/g, "").trim())
	.filter((l) => l.length > 0)
	.map((line) => glob.sync(line))
	.flat()
	.filter((l) => typeof l === "string" && l.length > 0);
/** @type {string[]} */
const sourceFiles = fs
	.readFileSync("SOURCE_FILES.txt", "utf8")
	.split("\n")
	.map((l) => l.replace(/\r/g, "").trim())
	.filter((l) => l.length > 0)
	.map((line) => glob.sync(path.join(basePath, line), { nodir: true, absolute: true }))
	.flat()
	.filter((l) => typeof l === "string" && l.endsWith(".sp"));
/**
 * @param {string} dir
 * @returns {string[]}
 */
const getIncludePaths = (dir) => {
	// We count this as a possible include path if at least one
	// of the files ends with ".inc" - That's it, very simple.
	const files = fs.readdirSync(dir);
	if (excludePaths.includes(dir)) {
		return [];
	}

	const output = [];
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (excludePaths.includes(filePath)) {
			continue;
		}

		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			output.push(...getIncludePaths(filePath));
		} else if (stat.isFile() && filePath.endsWith(".inc")) {
			output.push(dir);
			break;
		}
	}
	return output;
};
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

const includePaths = getIncludePaths(basePath);
console.log(`Include paths: ${includePaths}, based on exclude paths: ${excludePaths.join(", ")}`);

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
			includePaths.map((i) => `-i${i}`), // All paths which have at least one ".inc" file and are not excluded
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
