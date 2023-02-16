import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";

const basePath = process.argv.slice(2).join(" ");
/** @type {string[]} */
const sourceFiles = fs
	.readFileSync("SOURCE_FILES.txt", "utf8")
	.split("\n")
	.map((l) => path.join(basePath, l.replace(/\r/g, "").trim()))
	.filter((l) => l.length > 0)
	.flat()
	.filter((l) => typeof l === "string" && l.endsWith(".sp"));
/** @type {string[]} */
const extraIncludePaths = fs
	.readFileSync("EXTRA_INCLUDE_PATHS.txt", "utf8")
	.split("\n")
	.map((l) => path.join(basePath, l.replace(/\r/g, "").trim()))
	.filter((l) => l.length > 0);
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

let installJsonPath = fs.existsSync("INSTALL_JSON_PATH_OVERRIDE.txt")
	? fs.readFileSync("INSTALL_JSON_PATH_OVERRIDE.txt", "utf8").replace(/\n|\r/g, "").trim()
	: undefined;
if (!installJsonPath || installJsonPath.length <= 0) {
	installJsonPath = path.join(basePath, "install.json");
}

// Parse "install.json", download any dependencies, and assemble include paths
const json = JSON.parse(fs.readFileSync(installJsonPath));
const includePaths = [...extraIncludePaths, ...(json?.inclusion ?? []).map((i) => path.join(basePath, i))];
function downloadDependencies(dependencies) {
	if (!Array.isArray(dependencies)) {
		return;
	}

	for (const dependency of dependencies) {
		// Don't download dependencies we already downloaded
		const dependencyPath = path.join(process.cwd(), dependency.repo);
		if (fs.existsSync(dependencyPath)) {
			continue;
		}

		let url = `https://github.com/${dependency.user}/${dependency.repo}`;
		if (process.env.GITHUB_ACCESS_TOKEN) {
			url = `https://${dependecy.user}:${process.env.GITHUB_ACCESS_TOKEN}@github.com/${dependency.user}/${dependency.repo}`;
		}

		childProcess.execSync(`git clone ${url} ${dependencyPath}`, {
			cwd: process.cwd(),
			stdio: "inherit",
			encoding: "utf-8"
		});

		// Parse its install.json and add include paths
		const json = JSON.parse(fs.readFileSync(path.join(dependencyPath, "install.json")));
		if (json.inclusion) {
			for (const include of json.inclusion) {
				includePaths.push(path.join(dependencyPath, include));
			}
		}

		// Download dependencies recursively
		downloadDependencies(json.dependencies);
	}
}
downloadDependencies(json.dependencies);

console.log(`Include paths: ${includePaths.join(", ")}`);

for (const file of sourceFiles) {
	console.log(`Compiling: ${file}`);

	const parsed = path.parse(file);

	childProcess.execSync(
		[
			"spcomp", // When running locally for testing ensure spcomp is in your PATH
			file, // Input file
			"-E", // Treat warnings as errors
			"-O2", // Optimization level (0=none, 2=full)
			"-v2", // Verbosity level; 0=quiet, 1=normal, 2=verbose
			process.env.includePath ? `-i${process.env.includePath}` : [], // SourcePawn include path from setup-sp (Does not exist locally)
			includePaths.map((i) => `-i${i}`), // Include paths
			`-o ${outputPath || parsed.dir}/${parsed.base.replace(".sp", ".smx")}` // Output path, either from input or same as source file
		]
			.flat()
			.join(" "),
		{
			encoding: "utf8",
			stdio: "inherit"
		}
	);
}
