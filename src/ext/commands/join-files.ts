import { commands, ProgressLocation, Uri, ViewColumn, window } from 'vscode';
import { Logger } from '../utilities/logger';
import { tryOpenDocument } from './try-open-document';
import { OperationAborted } from '../errors/operation-aborted';
import { Config } from '../utilities/config';

const logger = new Logger('join-files');

export async function joinFiles(files: Uri[]): Promise<void> {
  const incrementProgressBy = (1 / files.length) * 100;

  await window.withProgress(
    {
      cancellable: true,
      location: ProgressLocation.Notification,
      title: 'compressing documents',
    },
    async (progress, token) => {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (token.isCancellationRequested) {
          const message = `Operation cancelled. Processed ${index} files.`;
          await showModal(message);
          throw new OperationAborted(message);
        }
        progress.report({ message: file.fsPath, increment: incrementProgressBy });
        await joinFile(file);
      }

      if (!token.isCancellationRequested) {
        await showModal(`Join Files completed. Processed ${files.length} files.`);
      }
    });
}

async function showModal(message: string): Promise<void> {
  await window.showInformationMessage(message, { modal: true });
}

async function joinFile(file: Uri): Promise<void> {
  logger.info(`compressing ${file.fsPath}`);

  const doc = await tryOpenDocument(file.path);

  if (doc) {
    await window.showTextDocument(doc, { preview: false, viewColumn: ViewColumn.One });
    if (Config.instance.runOrganizeImports) {
      await commands.executeCommand('editor.action.organizeImports');
    }
    await commands.executeCommand('editor.action.selectAll');
    await commands.executeCommand('editor.action.joinLines');
    await commands.executeCommand('cursorTop');
    await commands.executeCommand('workbench.action.files.save');
    await commands.executeCommand('workbench.action.closeActiveEditor');
  }
}