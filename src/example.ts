import EditorJS from "@editorjs/editorjs";
import UploadVideoTool, { UploadVideoToolConfig } from ".";

//@ts-ignore
export const editor = new EditorJS({
  holder: "editorjs",
  // readOnly: true,
  tools: {
    "upload-video": {
      class: UploadVideoTool,
      inlineToolbar: true,
      config: {
        uploader: (file: File): Promise<{ url: string }> =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({ url: "src/assets/example.mp4" });
            }, 5000),
          ),
        errorHandler: (error: Error) => {
          console.log(error);
        },
        uploadButtonText: "Upload brand new video",
        changeVideoButtonText: "Wanna change video?",
        videoCaptionPlaceholder: "Video caption, leave blank for no caption",
        uploaderReturnNoUrlText: "Uploader didn't do it's job",
        uploadFailedText: "Oh noooo, the upload failed(((",
        videoAcceptFormats: ["video/mp4", ".ogg"],
        allowCaption: true,
        featureFlags: {
          // all true by default
          // border: true,
          // background: true,
          // stretch: true,
          // caption: true,
          // chooseFileOnInit: true,
        },
      } as UploadVideoToolConfig,
    },
  },
  data: {
    time: 1552744582955,
    blocks: [
      {
        id: "hZAjSnqYMX",
        type: "upload-video",
        data: {
          url: "src/assets/example.mp4",
          withBorder: true,
          withBackground: true,
          stretched: false,
          withCaption: true,
          caption: "All your base are belong to us",
        },
      },
    ],
  },
});

// block data example
// {
//   url: "http://localhost:5173/src/assets/example.mp4",
//   caption: "<i><b><a href=\"https://wikipedia.com\">fw</a></b></i>,
//   withBorder: true,
//   withBackground: false,
//   stretched: false,
//   withCaption: true
// }

document.querySelector("#save-btn")?.addEventListener("click", async () => {
  const savedData = await editor.save();
  console.log("SAVED DATA", savedData);
});
