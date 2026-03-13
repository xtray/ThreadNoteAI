import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import {
    assertFileExists,
    assertDirectoryExists,
    getArchiveFileName,
    getArtifactDirectory,
    getArchivePath,
    getPackageReadmeTargets,
} from '../../scripts/pack-extension.mjs';

describe('extension offline packaging helpers', () => {
    it('builds a versioned archive filename from package metadata', () => {
        expect(getArchiveFileName('1.2.3')).toBe('ThreadNoteAI-v1.2.3.zip');
    });

    it('derives archive paths under the artifacts directory', () => {
        expect(getArtifactDirectory('/repo')).toBe('/repo/artifacts');
        expect(getArchivePath('/repo', '1.2.3')).toBe('/repo/artifacts/ThreadNoteAI-v1.2.3.zip');
    });

    it('rejects a missing dist directory before archiving', async () => {
        await expect(assertDirectoryExists('/definitely-missing-threadnote-dist')).rejects.toThrow(
            'Required directory not found'
        );
    });

    it('maps package doc sources to requested archive filenames', () => {
        expect(getPackageReadmeTargets('/repo')).toEqual([
            {
                sourcePath: '/repo/package-docs/README.md',
                targetPath: '/repo/dist/README.md',
            },
            {
                sourcePath: '/repo/package-docs/Readme-CN.md',
                targetPath: '/repo/dist/Readme-CN.md',
            },
        ]);
    });

    it('rejects a missing package doc source file', async () => {
        await expect(assertFileExists('/definitely-missing-threadnote-readme.md')).rejects.toThrow(
            'Required file not found'
        );
    });

    it('documents the required end-user manual sections in both packaged readmes', async () => {
        const englishReadme = await readFile('package-docs/README.md', 'utf8');
        const chineseReadme = await readFile('package-docs/Readme-CN.md', 'utf8');

        expect(englishReadme).toContain('## Install in Edge (Developer Mode)');
        expect(englishReadme).toContain('## Recommended First-Use Flow');
        expect(englishReadme).toContain('## Update to a New Version');
        expect(englishReadme).toContain('## Install Troubleshooting');
        expect(englishReadme).toContain('## Before You Upgrade');
        expect(englishReadme).toContain('select the folder that contains `manifest.json`');
        expect(chineseReadme).toContain('## 在 Edge 中以开发者模式安装');
        expect(chineseReadme).toContain('## 推荐使用流程');
        expect(chineseReadme).toContain('## 升级到新版本');
        expect(chineseReadme).toContain('## 安装失败排查对照表');
        expect(chineseReadme).toContain('## 升级前建议先导出这些数据');
        expect(chineseReadme).toContain('选择包含 `manifest.json` 的那个目录');
    });
});
