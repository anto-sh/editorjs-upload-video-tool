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
// Video accept formats for <video> tag accept attribute
export type VideoAcceptFormatItem =
  | `video/${SupportedVideoFormats}`
  | `.${SupportedVideoFormats}`;

/**
 * Tool config.
 * uploader is a required function called when a file is selected.
 */
export interface UploadVideoToolConfig extends ToolConfig {
  uploader: (file: File) => Promise<{ url: string; [key: string]: any }>;
  errorHandler?: (e: Error) => void;
  allowCaption: boolean;
  videoAcceptFormats?: VideoAcceptFormatItem[];
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
  private _data: UploadVideoToolData;
  private config: UploadVideoToolConfig;
  private api: API;
  private container: HTMLDivElement | null = null;
  private readOnly: boolean;
  private block: BlockAPI;

  private containerClassName = "upload-video";

  constructor({
    data,
    config,
    api,
    readOnly,
    block,
  }: UploadVideoToolConstructorOptions) {
    this._data = {
      url: "",
      caption: "",
      withBorder: false,
      withBackground: false,
      stretched: false,
      withCaption: false,
    };
    this.data = data;

    this.config = {
      ...config,
      uploader:
        config?.uploader ||
        (() => {
          throw new Error("No uploader specified!");
        }),
      allowCaption:
        typeof config?.allowCaption === "boolean" ? config.allowCaption : true,
    };

    this.api = api;
    this.readOnly = readOnly;
    this.block = block;
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
        title: "Stretch image",
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
      if (t.name === "withCaption") return this.config.allowCaption;
      return true;
    });

    const enrichedTunes = availableTunes.map((t) => ({
      ...t,
      isActive: isActive(t.name),
      onActivate: () => this._setTune(t.name, !isActive(t.name)),
    }));

    return enrichedTunes;
  }

  /**
   * Stores all Tool's data
   * @param data - data in Image Tool format
   */
  private set data(data: UploadVideoToolData) {
    this._data.url = data.url;
    this._data.caption = data.caption || "";

    this._setAllTunesByData(data);
  }

  /**
   * Return Tool data
   */
  private get data(): UploadVideoToolData {
    return this._data;
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

      let newVideoContainer;

      try {
        this.container?.classList.add(`${this.containerClassName}--uploading`);

        const oldVideoContainer = this.container.querySelector<HTMLDivElement>(
          `.${this.containerClassName}__video-container`,
        );
        if (!oldVideoContainer) {
          newVideoContainer = this._insertVideoContainer();
          if (!newVideoContainer) throw new Error("No video container!");
          this.container?.prepend(newVideoContainer);
        }

        const result = await this.config.uploader(file);

        if (!result?.url) {
          throw new Error(
            this.api.i18n.t(
              this.config.uploaderReturnNoUrlText || "Uploader returned no URL",
            ),
          );
        }

        this.data.url = result.url;
        this._showVideo(result.url);
      } catch (error) {
        if (newVideoContainer) newVideoContainer.remove();
        if (this.config.errorHandler) this.config.errorHandler(error as Error);
        else {
          alert(this.config.uploadFailedText || "Upload failed.");
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

    if (tuneName === "withCaption") {
      // Wait until the API is ready
      queueMicrotask(() => {
        if (this.config.allowCaption) this._toggleTuneClass(tuneName, value);
      });
    } else if (tuneName === "stretched") {
      // Wait until the API is ready
      queueMicrotask(() => {
        if (this.config.allowCaption) this._toggleTuneClass(tuneName, value);
        this.block.stretched = value;
        this._toggleTuneClass(tuneName, value);
      });
    } else {
      this._toggleTuneClass(tuneName, value);
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
