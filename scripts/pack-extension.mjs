import { access, copyFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const getArchiveFileName = (version) => `ThreadNoteAI-v${version}.zip`;

export const getArtifactDirectory = (rootDir) => path.join(rootDir, 'artifacts');

export const getArchivePath = (rootDir, version) => path.join(getArtifactDirectory(rootDir), getArchiveFileName(version));

export const assertDirectoryExists = async (dirPath) => {
    try {
        const target = await stat(dirPath);
        if (!target.isDirectory()) {
            throw new Error(`Required directory is not a directory: ${dirPath}`);
        }
    } catch (error) {
        throw new Error(`Required directory not found: ${dirPath}`, { cause: error });
    }
};

export const assertFileExists = async (filePath) => {
    try {
        const target = await stat(filePath);
        if (!target.isFile()) {
            throw new Error(`Required file is not a file: ${filePath}`);
        }
    } catch (error) {
        throw new Error(`Required file not found: ${filePath}`, { cause: error });
    }
};

export const getPackageReadmeTargets = (rootDir) => [
    {
        sourcePath: path.join(rootDir, 'package-docs', 'README.md'),
        targetPath: path.join(rootDir, 'dist', 'README.md'),
    },
    {
        sourcePath: path.join(rootDir, 'package-docs', 'Readme-CN.md'),
        targetPath: path.join(rootDir, 'dist', 'Readme-CN.md'),
    },
];

export const resolveArchiveVersion = (packageVersion, releaseVersion = '') => {
    const normalizedReleaseVersion = releaseVersion.trim().replace(/^v/, '');
    return normalizedReleaseVersion || packageVersion;
};

const readPackageVersion = async (rootDir) => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const raw = await readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    if (!pkg.version || typeof pkg.version !== 'string') {
        throw new Error(`Missing package version in ${packageJsonPath}`);
    }
    return pkg.version;
};

const ensureArtifactDirectory = async (rootDir) => {
    const artifactDir = getArtifactDirectory(rootDir);
    await mkdir(artifactDir, { recursive: true });
    return artifactDir;
};

const removeIfPresent = async (targetPath) => {
    try {
        await access(targetPath);
        await rm(targetPath);
    } catch {
        // Ignore when the previous archive does not exist.
    }
};

const stagePackageReadmes = async (rootDir) => {
    const targets = getPackageReadmeTargets(rootDir);
    await Promise.all(
        targets.map(async ({ sourcePath, targetPath }) => {
            await assertFileExists(sourcePath);
            await copyFile(sourcePath, targetPath);
        })
    );
};

const zipWithZipCommand = async (distDir, archivePath) => {
    await execFileAsync('zip', ['-r', archivePath, '.'], { cwd: distDir });
};

const zipWithPowerShell = async (distDir, archivePath) => {
    const command = `Compress-Archive -Path * -DestinationPath '${archivePath.replace(/'/g, "''")}' -Force`;
    await execFileAsync('powershell', ['-NoProfile', '-Command', command], { cwd: distDir });
};

export const packExtension = async (rootDir) => {
    const distDir = path.join(rootDir, 'dist');
    await assertDirectoryExists(distDir);

    const packageVersion = await readPackageVersion(rootDir);
    const version = resolveArchiveVersion(packageVersion, process.env.THREADNOTE_RELEASE_VERSION);
    const artifactDir = await ensureArtifactDirectory(rootDir);
    const archivePath = getArchivePath(rootDir, version);

    await removeIfPresent(archivePath);
    await stagePackageReadmes(rootDir);

    if (process.platform === 'win32') {
        await zipWithPowerShell(distDir, archivePath);
    } else {
        await zipWithZipCommand(distDir, archivePath);
    }

    return {
        artifactDir,
        archivePath,
        version,
    };
};

const runCli = async () => {
    const scriptPath = fileURLToPath(import.meta.url);
    const rootDir = path.resolve(path.dirname(scriptPath), '..');
    const result = await packExtension(rootDir);
    process.stdout.write(`Created offline extension package: ${result.archivePath}\n`);
};

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
    runCli().catch((error) => {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = 1;
    });
}
