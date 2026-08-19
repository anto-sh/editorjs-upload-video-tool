import "./style.css";

import type {
  API,
  ToolConfig,
  BlockToolData,
  BlockTool,
  BlockAPI,
} from "@editorjs/editorjs";

import {
  IconAddBorder,
  IconStretch,
  IconAddBackground,
  IconPlay,
  IconLoader,
  IconText,
} from "@codexteam/icons";
import type {
  BlockToolConstructorOptions,
  MenuConfig,
} from "@editorjs/editorjs/types/tools";

export interface UploadVideoToolData extends BlockToolData {
  url?: string;
  caption?: string;
  withBorder?: boolean;
  withBackground?: boolean;
  stretched?: boolean;
  withCaption?: boolean;
}

export type SupportedVideoFormats = "mp4" | "webm" | "ogg";
// Video accept formats for <video> tag accept attribute and file validation
export type VideoAcceptFormatItem =
  | `video/${SupportedVideoFormats}`
  | `.${SupportedVideoFormats}`;

export type UploadVideoToolFeatureFlagsConfig = {
  caption?: boolean;
  border?: boolean;
  background?: boolean;
  stretch?: boolean;
  chooseFileOnInit?: boolean;
};

/**
 * `byEndpoint` option config
 * You can't use an additional `Content-Type` header, it'll be vanished
 */
export type UploadVideoToolByEndpointConfig = {
  url: string;
  fileFieldName?: string;
  credentials?: RequestCredentials;
  additionalRequestHeaders?: HeadersInit;
  additionalRequestData?: Record<string, string>;
};

/**
 * Tool config.
 * `uploader` function called when a file is selected.
 * If uploader in undenfined, then tool uses `byEndpoint` config with required `url` to upload file.
 * Else you got an error.
 */
export interface UploadVideoToolConfig extends ToolConfig {
  uploader?: (file: File) => Promise<{ url: string; [key: string]: any }>;
  byEndpoint?: UploadVideoToolByEndpointConfig;
  videoAcceptFormats?: VideoAcceptFormatItem[];
  featureFlags?: UploadVideoToolFeatureFlagsConfig;
  errorHandler?: (e: Error) => void;
  uploadButtonText?: string;
  changeVideoButtonText?: string;
  videoCaptionPlaceholder?: string;
  uploaderReturnNoUrlText?: string;
  uploadFailedText?: string;
}

type UploadVideoToolConstructorOptions = BlockToolConstructorOptions<
  UploadVideoToolData,
  UploadVideoToolConfig
>;

export default class UploadVideoTool implements BlockTool {
  private config: UploadVideoToolConfig;
  private api: API;
  private container: HTMLDivElement | null = null;
  private readOnly: boolean;
  private block: BlockAPI;
  private _data: UploadVideoToolData = {
    url: "",
    caption: "",
    withBorder: false,
    withBackground: false,
    stretched: false,
    withCaption: false,
  };

  private containerClassName = "upload-video";

  constructor({
    data,
    config,
    api,
    readOnly,
    block,
  }: UploadVideoToolConstructorOptions) {
    this.block = block;

    const getFeatureFlagValue = (
      flagName: keyof UploadVideoToolFeatureFlagsConfig,
    ) => {
      return typeof config?.featureFlags?.[flagName] === "boolean"
        ? config?.featureFlags?.[flagName]
        : true;
    };
    this.config = {
      ...config,
      featureFlags: {
        border: getFeatureFlagValue("border"),
        background: getFeatureFlagValue("background"),
        stretch: getFeatureFlagValue("stretch"),
        caption: getFeatureFlagValue("caption"),
        chooseFileOnInit: getFeatureFlagValue("chooseFileOnInit"),
      },
    };
    this.api = api;
    this.readOnly = readOnly;

    this.data = data;
  }

  /**
   * Stores all Tool's data
   * @param data - data in Video Upload Tool format
   */
  private set data(data: UploadVideoToolData) {
    this._data.url = data.url;
    this._data.caption = data.caption;

    this._setAllTunesByData(data);
  }

  /**
   * Return Tool data
   */
  private get data(): UploadVideoToolData {
    return this._data;
  }

  /**
   * Notify core that read-only mode is suppoorted
   * @returns { boolean }
   */
  static get isReadOnlySupported() {
    return true;
  }

  static get sanitize() {
    return {
      url: false,
      caption: {},
    };
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   */
  static get toolbox() {
    return {
      title: "Upload Video",
      icon: IconPlay,
    };
  }

  /**
   * Available tools tunes
   */
  public static get tunes() {
    return [
      {
        name: "withBorder",
        icon: IconAddBorder,
        title: "With border",
        toggle: true,
      },
      {
        name: "withBackground",
        icon: IconAddBackground,
        title: "With background",
        toggle: true,
      },
      {
        name: "stretched",
        icon: IconStretch,
        title: "Stretch video",
        toggle: true,
      },
      {
        name: "withCaption",
        icon: IconText,
        title: "With caption",
        toggle: true,
      },
    ] as const;
  }

  public render(): HTMLDivElement {
    this.container = document.createElement("div");
    this.container.classList.add(this.api.styles.block);
    this.container.classList.add(this.containerClassName);

    if (this.data.url) {
      this._showVideo(this.data.url);
    } else {
      if (!this.readOnly) this._showUploadButton();
    }

    this._setAllTunesByData(this.data);

    return this.container;
  }

  public save(blockContent: HTMLDivElement): UploadVideoToolData {
    return {
      ...this.data,
      url: blockContent?.querySelector("video")?.src.trim(),
      caption: this.data.withCaption
        ? blockContent
            ?.querySelector<HTMLDivElement>("#caption")
            ?.innerHTML.trim() || undefined
        : undefined,
    };
  }

  validate(savedData: UploadVideoToolData) {
    if (!savedData.url) {
      return false;
    }
    return true;
  }

  public renderSettings(): MenuConfig {
    /**
     * Check if the tune is active
     * @param tune - tune to check
     */
    const isActive = (tuneName: keyof UploadVideoToolData): boolean => {
      return this.data[tuneName] as boolean;
    };

    const availableTunes = UploadVideoTool.tunes.filter((t) => {
      if (t.name === "withBorder") return this.config.featureFlags?.border;
      else if (t.name === "withBackground")
        return this.config.featureFlags?.background;
      else if (t.name === "stretched") return this.config.featureFlags?.stretch;
      else if (t.name === "withCaption")
        return this.config.featureFlags?.caption;

      return true;
    });

    const enrichedTunes = availableTunes.map((t) => ({
      ...t,
      label: this.api.i18n.t(t.title),
      isActive: isActive(t.name),
      onActivate: () => this._setTune(t.name, !isActive(t.name)),
    }));

    return enrichedTunes;
  }

  /**
   * Fires after clicks on the Toolbox Video Upload Icon
   * Initiates file dialog
   */
  public rendered(): void {
    queueMicrotask(() => {
      if (this.config.featureFlags?.chooseFileOnInit) this._triggerFileDialog();
    });
  }

  private _showUploadButton(): void {
    if (!this.container) return;

    this.container.innerHTML = "";

    const btn = document.createElement("div");
    btn.classList.add(`${this.containerClassName}__loader-btn`);
    btn.classList.add(`${this.containerClassName}__upload-btn`);
    btn.textContent = this.api.i18n.t(
      this.config.uploadButtonText || "Upload Video",
    );
    btn.classList.add(this.api.styles.button);
    btn.addEventListener("click", () => this._triggerFileDialog());

    this.container.appendChild(btn);
  }

  private _triggerFileDialog(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      this.config.videoAcceptFormats?.join(",") ||
      "video/mp4, video/webm, video/ogg, .mp4, .webm, .ogg";
    input.multiple = false;

    input.onchange = async () => {
      if (!this.container) return;
      const file = input.files?.[0];
      if (!file) return;

      try {
        this.container?.classList.add(`${this.containerClassName}--uploading`);
        const oldVideoContainer = this.container.querySelector<HTMLDivElement>(
          `.${this.containerClassName}__video-container`,
        );
        if (!oldVideoContainer) {
          var newVideoContainer = this._insertVideoContainer();
          if (!newVideoContainer)
            throw new Error(this.api.i18n.t("No video container!"));
          this.container?.prepend(newVideoContainer);
        }

        const videoUrl = await this._uploadVideo(file);
        this._showVideo(videoUrl);
      } catch (error) {
        if (newVideoContainer) newVideoContainer.remove();
        if (this.config.errorHandler) this.config.errorHandler(error as Error);
        else {
          alert(
            this.api.i18n.t(
              this.config.uploadFailedText || "Upload failed.\n" + error,
            ),
          );
          throw error;
        }
      } finally {
        this.container?.classList.remove(
          `${this.containerClassName}--uploading`,
        );
      }
    };

    input.click();
  }

  private async _uploadVideo(file: File) {
    let result;
    if (this.config.uploader) {
      result = await this.config.uploader(file);
    } else if (this.config.byEndpoint?.url) {
      result = await this._defaultUploader(file);
    } else
      throw new Error(
        this.api.i18n.t(
          "Config error: neither 'uploader' nor 'byEndpoint.url' is defined.",
        ),
      );

    if (!result?.url) {
      throw new Error(
        this.api.i18n.t(
          this.config.uploaderReturnNoUrlText || "Uploader returned no URL",
        ),
      );
    }

    this.data.url = result.url;
    return result.url;
  }

  private async _defaultUploader(file: File) {
    const formData = new FormData();
    formData.append(this.config.byEndpoint?.fileFieldName || "video", file);

    const additionalRequestData = this.config.byEndpoint?.additionalRequestData;
    if (additionalRequestData) {
      Object.entries(additionalRequestData).forEach(([key, value]) => {
        if (key) formData.append(key, value);
      });
    }

    const additionalRequestHeaders = new Headers(
      this.config.byEndpoint?.additionalRequestHeaders,
    );
    // To prevent the loss of the unique FormData boundary
    additionalRequestHeaders.delete("content-type");

    const response = await fetch(this.config.byEndpoint?.url!, {
      method: "POST",
      headers: additionalRequestHeaders,
      body: formData,
      credentials: this.config.byEndpoint?.credentials,
    });

    if (!response.ok)
      throw new Error(
        this.api.i18n.t(this.config.uploadFailedText || "Upload failed."),
      );

    return response.json();
  }

  private _showVideo(url: string): void {
    if (!this.container) return;
    const videoContainer = this._insertVideoContainer();
    if (!videoContainer) return;

    const prevCaptionText = this.container.querySelector<HTMLDivElement>(
      `.${this.containerClassName}__caption`,
    )?.innerHTML;

    this.container.innerHTML = "";

    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.classList.add(`${this.containerClassName}__video`);

    // Caption creation
    const caption = document.createElement("div");
    caption.innerHTML = prevCaptionText || this.data.caption || "";

    if (!this.readOnly) {
      caption.contentEditable = "true";
      caption.setAttribute(
        "data-placeholder",
        this.api.i18n.t(
          this.config.videoCaptionPlaceholder || "Caption for video",
        ),
      );
    }

    caption.id = "caption";
    caption.classList.add(this.api.styles.input);
    caption.classList.add(`${this.containerClassName}__caption`);

    // Appending elements to container
    videoContainer.appendChild(video);
    this.container.appendChild(videoContainer);
    this.container.appendChild(caption);

    // Change button
    if (!this.readOnly) {
      const changeBtn = document.createElement("div");
      changeBtn.textContent = this.api.i18n.t(
        this.config.changeVideoButtonText || "Change Video",
      );

      changeBtn.classList.add(`${this.containerClassName}__loader-btn`);
      changeBtn.classList.add(`${this.containerClassName}__change-btn`);
      changeBtn.classList.add(this.api.styles.button);
      changeBtn.addEventListener("click", () => {
        this._triggerFileDialog();
      });
      this.container.appendChild(changeBtn);
    }
  }

  private _insertVideoContainer() {
    if (!this.container) return;
    const videoContainer = document.createElement("div");
    videoContainer.classList.add(`${this.containerClassName}__video-container`);

    // Loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.classList.add(
      `${this.containerClassName}__loading-indicator`,
    );
    loadingIndicator.innerHTML = IconLoader;

    videoContainer.append(loadingIndicator);
    this.container?.append(videoContainer);

    return videoContainer;
  }

  private _toggleTuneClass(
    tuneName: keyof UploadVideoToolData,
    value: boolean,
  ) {
    this.container?.classList.toggle(
      `${this.containerClassName}--${tuneName}`,
      value,
    );
  }

  private _setTune(tuneName: keyof UploadVideoToolData, value: boolean) {
    this.data[tuneName] = value;

    switch (tuneName) {
      case "withBorder":
        // Wait until the API is ready
        queueMicrotask(() => {
          if (this.config.featureFlags?.border)
            this._toggleTuneClass(tuneName, value);
        });
        break;

      case "withBackground":
        queueMicrotask(() => {
          if (this.config.featureFlags?.background)
            this._toggleTuneClass(tuneName, value);
        });
        break;

      case "stretched":
        queueMicrotask(() => {
          if (this.config.featureFlags?.stretch) {
            this.block.stretched = value;
            this._toggleTuneClass(tuneName, value);
          }
        });
        break;
      case "withCaption":
        queueMicrotask(() => {
          if (this.config.featureFlags?.caption)
            this._toggleTuneClass(tuneName, value);
        });
        break;

      default:
        this._toggleTuneClass(tuneName, value);
        break;
    }
  }

  private _setAllTunesByData(data: UploadVideoToolData) {
    UploadVideoTool.tunes.forEach(({ name: tune }) => {
      const value =
        typeof data[tune as keyof UploadVideoTool] !== "undefined"
          ? data[tune as keyof UploadVideoTool] === true ||
            data[tune as keyof UploadVideoTool] === "true"
          : false;

      this._setTune(tune as keyof UploadVideoTool, value);
    });
  }
}
