import EditorJS, { type BlockToolConstructable } from "@editorjs/editorjs";
import UploadVideo from ".";

//@ts-ignore
const editor = new EditorJS({
  holder: "editorjs",
  tools: {
    "upload-video": {
      // type hack cause i don't have a better solution yet.
      class: UploadVideo as BlockToolConstructable,
      config: {
        uploader: (): Promise<{ url: string }> =>
          new Promise((resolve) => resolve({ url: "src/assets/example.mp4" })),
        errorHandler: (error: Error) => {
          console.log(error);
        },
        uploadButtonText: "Upload brand new video",
        changeVideoButtonText: "Wanna change video?",
        videoCaptionPlaceholder: "Video caption, leave blank for no caption",
        uploaderReturnNoUrlText: "Uploader didn't do it's job",
        uploadFailedText: "Oh noooo, the upload failed(((",
      },
    },
  },
  //   // data: {
  //   //     time: 1552744582955,
  //   //     blocks: [
  //   //         {
  //   //             type: "upload-video",
  //   //             data: {
  //   //                 url: "src/assets/example.mp4"
  //   //             }
  //   //         }
  //   //     ],
  //   // },
});
