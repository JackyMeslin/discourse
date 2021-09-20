import { BasePlugin } from "@uppy/core";
import { Promise } from "rsvp";
import { debug, warn } from "@ember/debug";

export class UppyPluginBase extends BasePlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = this.constructor.pluginId;
  }

  _consoleWarn(msg) {
    warn(`[${this.id}] ${msg}`, { id: `discourse.${this.id}` });
  }

  _consoleDebug(msg) {
    if (this.siteSettings?.enable_upload_debug_mode) {
      debug(`[${this.id}] ${msg}`, { id: `discourse.${this.id}` });
    }
  }

  _getFile(fileId) {
    return this.uppy.getFile(fileId);
  }

  _setFileMeta(fileId, meta) {
    this.uppy.setFileMeta(fileId, meta);
  }

  _setFileState(fileId, state) {
    this.uppy.setFileState(fileId, state);
  }
}

export class UploadPreProcessorPlugin extends UppyPluginBase {
  static pluginType = "preprocessor";

  constructor(uppy, opts) {
    super(uppy, opts);
    this.type = this.constructor.pluginType;
  }

  _install(fn) {
    this.uppy.addPreProcessor(fn);
  }

  _uninstall(fn) {
    this.uppy.removePreProcessor(fn);
  }

  _emitProgress(file) {
    this.uppy.emit("preprocess-progress", file, null, this.id);
  }

  _emitComplete(file, skipped = false) {
    this.uppy.emit("preprocess-complete", file, skipped, this.id);
    return Promise.resolve();
  }

  _emitAllComplete(fileIds, skipped = false) {
    fileIds.forEach((fileId) => {
      let file = this._getFile(fileId);
      this._emitComplete(file, skipped);
    });
    return Promise.resolve();
  }

  _emitError(file, errorMessage) {
    // the error message is stored twice; once to show in a displayErrorForUpload
    // modal, and on the .message property to show in the uppy logs
    this.uppy.emit("upload-error", file, {
      errors: [errorMessage],
      message: `[${this.id}] ${errorMessage}`,
    });
  }

  _skip(file) {
    return this._emitComplete(file, true);
  }

  _skipAll(file) {
    return this._emitAllComplete(file, true);
  }
}
