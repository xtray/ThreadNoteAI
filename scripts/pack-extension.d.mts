export function getArchiveFileName(version: string): string;
export function getArtifactDirectory(rootDir: string): string;
export function getArchivePath(rootDir: string, version: string): string;
export function assertDirectoryExists(dirPath: string): Promise<void>;
export function assertFileExists(filePath: string): Promise<void>;
export function getPackageReadmeTargets(rootDir: string): Array<{
    sourcePath: string;
    targetPath: string;
}>;
export function packExtension(rootDir: string): Promise<{
    artifactDir: string;
    archivePath: string;
    version: string;
}>;
