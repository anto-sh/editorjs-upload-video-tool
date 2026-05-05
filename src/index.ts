import "./style.css";

import type {
  API,
  ToolConfig,
  BlockToolData,
  BlockTool,
} from "@editorjs/editorjs";

export interface UploadVideoData extends BlockToolData {
  url?: string;
  caption?: string;
}

/**
 * Tool config.
 * uploader is a required function called when a file is selected.
 */
export interface UploadVideoConfig extends ToolConfig {
  uploader: (file: File) => Promise<{ url: string; [key: string]: any }>;
  errorHandler?: (e: Error) => void;
  uploadButtonText?: string;
  changeVideoButtonText?: string;
  videoCaptionPlaceholder?: string;
  uploaderReturnNoUrlText?: string;
  uploadFailedText?: string;
}

export default class UploadVideo implements BlockTool {
  private data: UploadVideoData;
  private config: UploadVideoConfig;
  private api: API;
  private container: HTMLDivElement | null = null;
  private readOnly: boolean;

  constructor({
    data,
    config,
    api,
    readOnly,
  }: {
    data: UploadVideoData;
    config: UploadVideoConfig;
    api: API;
    readOnly: boolean;
  }) {
    this.data = data;
    this.config = config;
    this.api = api;
    this.readOnly = readOnly;
  }

  static get toolbox() {
    return {
      title: "Upload Video",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm3 2l4 4-4 4h8V7H8z" fill="currentColor"/>
            </svg>`,
    };
  }

  public render(): HTMLDivElement {
    this.container = document.createElement("div");
    this.container.classList.add("upload-video");

    if (this.data.url) {
      this._showVideo(this.data.url);
    } else {
      this._showUploadButton();
    }

    return this.container;
  }

  public save(blockContent: HTMLDivElement): UploadVideoData {
    return {
      url: blockContent?.querySelector("video")?.src,
      caption:
        (
          blockContent?.querySelector("#caption") as HTMLInputElement
        )?.value.trim() || undefined,
    };
  }

  validate(savedData: UploadVideoData) {
    if (!savedData.url) {
      return false;
    }

    return true;
  }

  private _showUploadButton(): void {
    if (!this.container) return;
    this.container.innerHTML = "";

    const btn = document.createElement("div");
    // btn.classList.add("upload-video__upload-btn");
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
    input.accept = "video/*";
    input.multiple = false;

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
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
        if (this.config.errorHandler) this.config.errorHandler(error as Error);
        else {
          console.log(error);
          alert(this.config.uploadFailedText || "Upload failed.");
        }
      }
    };

    input.click();
  }

  private _showVideo(url: string): void {
    if (!this.container) return;
    this.container.innerHTML = "";

    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.classList.add("upload-video__video");
    video.style.maxWidth = "100%";
    video.style.display = "block";

    let caption;
    if (this.readOnly) {
      caption = document.createElement("div");
      caption.innerHTML = this.data.caption ?? "";
    } else {
      caption = document.createElement("input");
      caption.type = "text";
      caption.placeholder = this.api.i18n.t(
        this.config.videoCaptionPlaceholder || "Caption for video",
      );
      caption.value = this.data.caption ?? "";
    }
    caption.id = "caption";
    caption.classList.add(this.api.styles.input);
    caption.classList.add("upload-video__caption");

    this.container.appendChild(video);
    this.container.appendChild(caption);

    if (!this.readOnly) {
      const changeBtn = document.createElement("div");
      changeBtn.textContent = this.api.i18n.t(
        this.config.changeVideoButtonText || "Change Video",
      );
      // changeBtn.classList.add("upload-video__change-btn");
      changeBtn.classList.add(this.api.styles.button);
      changeBtn.addEventListener("click", () => {
        this._triggerFileDialog();
      });
      this.container.appendChild(changeBtn);
    }
  }

  static get sanitize() {
    return {
      url: false,
      caption: false,
    };
  }

  /**
   * Notify core that read-only mode is suppoorted
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }
}
