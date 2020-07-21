import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { FeatureConfig } from '../../../x-pack/plugins/features/common';

import { PLUGIN_ID, PLUGIN_NAME } from '../common';

import { SavedTemplateObject } from './saved_objects';

import { ScoreStackPluginSetup, ScoreStackPluginStart, ScoreStackPluginDeps } from './types';
import { defineRoutes } from './routes';

export const TemplateFeature: FeatureConfig = {
  id: 'template-management', // TODO: make const somewhere
  name: 'Template Management',
  icon: 'copyClipboard', // TODO: is there a better icon to use here?
  app: [PLUGIN_ID],
  privileges: {
    all: {
      excludeFromBasePrivileges: true,
      api: ['template_management-admin'], // TODO: make const somewhere
      app: [PLUGIN_ID],
      savedObject: {
        all: [SavedTemplateObject.name],
        read: [],
      },
      ui: [], // TODO: do we need to set UI capabilities?
    },
    read: {
      excludeFromBasePrivileges: true,
      api: ['template_management-read'], // TODO: make const somewhere
      savedObject: {
        all: [],
        read: [SavedTemplateObject.name],
      },
      ui: [], // TODO: again, do we need to set UI capabilities?
    },
  },
};

export class ScoreStackPlugin implements Plugin<ScoreStackPluginSetup, ScoreStackPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, plugins: ScoreStackPluginDeps) {
    this.logger.debug(`${PLUGIN_ID}: Setup`);

    // Register saved object types
    core.savedObjects.registerType(SavedTemplateObject);

    // Register features
    plugins.features.registerFeature(TemplateFeature);

    // Register server side APIs
    const router = core.http.createRouter();
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug(`${PLUGIN_ID}: Started`);
    return {};
  }

  public stop() {
    this.logger.debug(`${PLUGIN_ID}: Stopped`);
  }
}
