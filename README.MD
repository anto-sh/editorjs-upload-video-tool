# Upload Video Tool for Editor.js

Video Block tool for [Editor.js](https://editorjs.io) that uploads video files through **your own custom uploader function**.

[![npm version](https://badge.fury.io/js/editorjs-upload-video-tool.svg)](https://www.npmjs.com/package/editorjs-upload-video-tool)

Unlike tools that talk to a fixed backend endpoint, this tool doesn't ship with any upload logic of its own — you provide an `uploader` function and send the file wherever you like (your own server, S3, Cloudinary, Firebase Storage, etc.).

## Features

- Renders an uploaded video with the native `<video>` element
- Optional, editable caption
- Optional tunes: border, background, stretch, caption — each independently toggleable
- Read-only mode supported
- Fully themeable via CSS custom properties

## Installation

### Install via NPM

```shell
npm install editorjs-upload-video-tool
```

or with yarn:

```shell
yarn add editorjs-upload-video-tool
```

Then include the module in your bundle:

```javascript
import UploadVideoTool from "editorjs-upload-video-tool";
```

### Requirements

- [`@editorjs/editorjs`](https://github.com/codex-team/editor.js) `^2.x` installed alongside it

## Usage

Add the tool to the `tools` property of the Editor.js config. The **`uploader`** function is required — it receives the selected `File` and must resolve to an object containing a `url` field.

```javascript
import EditorJS from "@editorjs/editorjs";
import UploadVideoTool from "editorjs-upload-video-tool";

const editor = new EditorJS({
  tools: {
    video: {
      class: UploadVideoTool,
      config: {
        uploader: async (file) => {
          const formData = new FormData();
          formData.append("video", file);

          const response = await fetch("https://your-server.com/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const result = await response.json();

          // Must resolve with an object containing `url`.
          // Any extra fields are accepted but ignored by the tool.
          return {
            url: result.url,
          };
        },
        errorHandler: (error) => {
          console.error("Video upload failed:", error);
        },
      },
    },
  },
});
```

## Config Params

| Field                     | Type                                                                               | Required | Default                                                             | Description                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `uploader`                | `(file: File) => Promise<{ url: string, [key: string]: any }>`                     | **Yes**  | —                                                                   | Called with the selected file. Must resolve to an object with at least a `url` field. |
| `errorHandler`            | `(error: Error) => void`                                                           | No       | shows `alert()` and re-throws                                       | Called whenever `uploader` throws, rejects, or resolves without a `url`.              |
| `videoAcceptFormats`      | `Array<'video/mp4' \| 'video/webm' \| 'video/ogg' \| '.mp4' \| '.webm' \| '.ogg'>` | No       | `['video/mp4', 'video/webm', 'video/ogg', '.mp4', '.webm', '.ogg']` | Passed to the hidden file input's `accept` attribute.                                 |
| `uploadButtonText`        | `string`                                                                           | No       | `'Upload Video'`                                                    | Label of the initial upload button.                                                   |
| `changeVideoButtonText`   | `string`                                                                           | No       | `'Change Video'`                                                    | Label of the button shown below an uploaded video.                                    |
| `videoCaptionPlaceholder` | `string`                                                                           | No       | `'Caption for video'`                                               | Placeholder text of the empty caption field.                                          |
| `uploaderReturnNoUrlText` | `string`                                                                           | No       | `'Uploader returned no URL'`                                        | Error message used when `uploader` resolves without a `url`.                          |
| `uploadFailedText`        | `string`                                                                           | No       | `'Upload failed.'`                                                  | Message shown by the default `alert()` when no `errorHandler` is supplied.            |
| `featureFlags`            | `object`                                                                           | No       | all `true`                                                          | Enables/disables individual tunes — see below.                                        |

### `featureFlags`

| Flag               | Default | Description                                                           |
| ------------------ | ------- | --------------------------------------------------------------------- |
| `border`           | `true`  | Show the "With border" tune.                                          |
| `background`       | `true`  | Show the "With background" tune.                                      |
| `stretch`          | `true`  | Show the "Stretch video" tune.                                        |
| `caption`          | `true`  | Show the "With caption" tune.                                         |
| `chooseFileOnInit` | `true`  | Automatically open the file picker right after the Block is rendered. |

```javascript
config: {
  uploader: async (file) => ({ url: '...' }),
  featureFlags: {
    background: false,
    chooseFileOnInit: false,
  },
}
```

> **Note:** `chooseFileOnInit` opens the file picker every time the Block is rendered — that includes when a document containing an already-uploaded video is loaded, not just when a fresh Block is added from the toolbox. Set it to `false` if you don't want the dialog popping up on existing content.

## Tool's settings (tunes)

When a Block is selected, its toolbar exposes up to four tunes (each can be hidden via `featureFlags`):

| Tune            | Effect                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| With border     | Adds a border around the video container.                                |
| With background | Adds padding and a background color, and shrinks the video to 60% width. |
| Stretch video   | Stretches the Block to the full editor width.                            |
| With caption    | Reveals an editable caption field under the video.                       |

## Output data

| Field            | Type                  | Description                                                     |
| ---------------- | --------------------- | --------------------------------------------------------------- |
| `url`            | `string`              | URL of the uploaded video.                                      |
| `caption`        | `string \| undefined` | Caption HTML — present only when the "With caption" tune is on. |
| `withBorder`     | `boolean`             | State of the "With border" tune.                                |
| `withBackground` | `boolean`             | State of the "With background" tune.                            |
| `stretched`      | `boolean`             | State of the "Stretch video" tune.                              |
| `withCaption`    | `boolean`             | State of the "With caption" tune.                               |

```json
{
  "type": "video",
  "data": {
    "url": "https://example.com/uploads/demo.mp4",
    "caption": "A short clip of the demo",
    "withBorder": false,
    "withBackground": false,
    "stretched": true,
    "withCaption": true
  }
}
```

A Block without a `url` is treated as invalid and is dropped from the saved output.

## Styling

Class names follow BEM (`upload-video`, `upload-video__video`, `upload-video__video-container`, `upload-video__caption`, ...). Override these CSS custom properties to re-theme the tool:

```css
.upload-video {
  --bg-color: #cdd1e0;
  --front-color: #388ae5;
  --border-color: #e8e8eb;
}
```

## Read-only mode

The tool declares `isReadOnlySupported = true`. In read-only mode the upload/change buttons are hidden and the caption becomes non-editable, while any tunes saved with the data are still applied.

## License

MIT
