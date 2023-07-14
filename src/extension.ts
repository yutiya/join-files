import { commands, ExtensionContext, Uri } from 'vscode';
import { Constants } from './constants';
import { Logger } from './ext/utilities/logger';
import prompts from './ext/prompts';
import { joinFiles } from './ext/commands/join-files';
import { validateInWorkspace } from './ext/commands/validate-in-workspace';
import { Config } from './ext/utilities/config';
import { FileQueryApi } from './ext/queries/file-query-api';

const logger = new Logger('ext');

export function activate(context: ExtensionContext): void {
  logger.info('activating');

  registerCommand(
    context,
    Constants.joinFiles,
    joinFilesInWorkspace);
  registerCommand(
    context,
    Constants.joinFilesFolder,
    joinFilesInWorkspace);
  registerCommand(
    context,
    Constants.joinFilesFromGlob,
    fromGlob);

  logger.info('activated');
}

export function deactivate(): void {
  logger.info('Join Files deactivated');
}

function registerCommand(context: ExtensionContext, command: string, callback: any): void {
  logger.info(`registering command ${command}`);
  context.subscriptions
    .push(commands.registerCommand(command, callback));
}

async function joinFilesInWorkspace(inFolder?: Uri): Promise<void> {
  try {
    Config.load();
    openOutputChannel();
    logger.info(`Starting Join Files - Workspace ${inFolder ? 'Folder' : ''}`);
    validateInWorkspace();
    const workspaceFolder = await prompts.selectWorkspaceFolder(inFolder);
    const files = await FileQueryApi.getWorkspaceFiles(workspaceFolder, inFolder);
    await prompts.confirmStart(`Join Files: Start compressing ${files.length} workspace files?`);
    await joinFiles(files);

    logger.info(`Join Files completed`);
  }
  catch (error) {
    logger.error(error);
  }
}

async function fromGlob(): Promise<void> {
  try {
    Config.load();
    openOutputChannel();
    logger.info(`Starting Join Files - By Glob Pattern`);
    validateInWorkspace();
    const workspaceFolder = await prompts.selectWorkspaceFolder();
    const glob = await prompts.requestGlob();
    const useDefaultExcludes = await prompts.useDefaultExcludes();
    const files = await FileQueryApi.getWorkspaceFilesWithGlob(workspaceFolder, { glob, useDefaultExcludes });
    await prompts.confirmStart(`Join Files: Start compressing ${files.length} workspace files using glob '${glob}'?`);
    await joinFiles(files);

    logger.info(`Join Files completed`);
  }
  catch (error) {
    logger.error(error);
  }
}

function openOutputChannel(): void {
  Logger.outputChannel.show(true);
  Logger.outputChannel.appendLine('');
  Logger.outputChannel.appendLine(''.padStart(50, ':'));
}